var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;         // Ray parameter at intersection
	vec3     position;  // Point of intersection
	vec3     normal;    // Surface normal at the intersection
	Material mtl;       // Material at the intersection
};

// Scene inputs
uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

// Computes the intersection between a ray and all spheres in the scene.
// Updates the HitInfo with the closest intersection found.
bool IntersectRay(inout HitInfo hit, Ray ray) {
	hit.t = 1e30;
	bool foundHit = false;

	for (int i = 0; i < NUM_SPHERES; ++i) {
		vec3 oc = ray.pos - spheres[i].center;
		float a = dot(ray.dir, ray.dir);
		float b = 2.0 * dot(ray.dir, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
		float discriminant = b * b - 4.0 * a * c;

		if (discriminant > 0.0) {
			float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
			float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
			float t = (t1 > 0.0) ? t1 : t2;

			if (t > 0.0 && t < hit.t) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}


// Computes lighting at a point using the Blinn-Phong model,
// and accounts for shadows.
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
	vec3 color = vec3(0.0);

	for (int i = 0; i < NUM_LIGHTS; ++i) {
		vec3 lightDir = normalize(lights[i].position - position);

		// Raggio d'ombra
		Ray shadowRay;
		shadowRay.pos = position + normal * 0.001; // piccolo offset per evitare self-intersection
		shadowRay.dir = lightDir;

		HitInfo shadowHit;
		if (IntersectRay(shadowHit, shadowRay)) {
    		if (shadowHit.t < length(lights[i].position - position)) {
        		continue; // The point is in shadow, skip this light
    		}
		}
		// Diffuso
		float diff = max(dot(normal, lightDir), 0.0);
		vec3 diffuse = mtl.k_d * diff;

		// Speculare (Blinn-Phong)
		vec3 h = normalize(lightDir + view);
		float spec = pow(max(dot(normal, h), 0.0), mtl.n);
		vec3 specular = mtl.k_s * spec;

		color += lights[i].intensity * (diffuse + specular);
	}

	return color;
}



// Performs ray tracing and returns the final color for a given ray.
// Includes reflections up to 'bounceLimit' times.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;

		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			// Stop if the surface is not reflective
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			r.pos = hit.position + hit.normal * 0.001;
			r.dir = reflect(ray.dir, hit.normal);
			
			if (IntersectRay(h, r)) {
			// Compute shading at the reflection hit
				vec3 viewDir = normalize(-r.dir);
				clr += k_s * Shade(h.mtl, h.position, h.normal, viewDir);

				// Prepare for the next bounce
				k_s *= h.mtl.k_s;
				hit = h;
				ray = r;
			} else {
			// No intersection: sample the environment map
				clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
				break;
				}
		}
		return vec4( clr, 1 );	// Return final color with alpha 1
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;