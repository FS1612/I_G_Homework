// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
// Constructs the Model-View transformation matrix.
// Applies translation and then two rotations around X and Y axes.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	var cosX = Math.cos(rotationX);
	var sinX = Math.sin(rotationX);
	var cosY = Math.cos(rotationY);
	var sinY = Math.sin(rotationY);
	var rotXMat = [
		1, 0, 0, 0,
		0, cosX, sinX, 0,
		0, -sinX, cosX, 0,
		0, 0, 0, 1
	];

	var rotYMat = [
		cosY, 0, -sinY, 0,
		0, 1, 0, 0,
		sinY, 0, cosY, 0,
		0, 0, 0, 1
	];
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	 // Combine: first rotate, then translate
	var mv = MatrixMult(trans, MatrixMult(rotYMat, rotXMat));
	return mv;
}




// MeshDrawer: this class handles the mesh data and how it's drawn
class MeshDrawer
{

	constructor()
	{
		// Compile and link our vertex and fragment shaders
        this.prog = InitShaderProgram(this.vertexShaderSource(), this.fragmentShaderSource());

		// Create GPU buffers to store vertex positions, texture coordinates, and normals
        this.vertBuffer = gl.createBuffer();
        this.texBuffer = gl.createBuffer();
        this.normBuffer = gl.createBuffer();

		// Retrieve shader attribute locations from shader program
        this.aPosition = gl.getAttribLocation(this.prog, 'aPosition');
        this.aTexCoord = gl.getAttribLocation(this.prog, 'aTexCoord');
        this.aNormal   = gl.getAttribLocation(this.prog, 'aNormal');

		// Retrieve shader uniform locations from shader program
        this.uMatrixMVP    = gl.getUniformLocation(this.prog, 'uMatrixMVP'); // Full transformation (model-view-projection)
        this.uMatrixMV     = gl.getUniformLocation(this.prog, 'uMatrixMV');// Model-view only (no projection)
        this.uMatrixNormal = gl.getUniformLocation(this.prog, 'uMatrixNormal'); // Normal transformation
		this.uSwapYZ     = gl.getUniformLocation(this.prog, 'uSwapYZ');// Option to swap Y and Z axe
        this.uUseTexture = gl.getUniformLocation(this.prog, 'uUseTexture');  // Toggle texture usage
        this.uLightDir   = gl.getUniformLocation(this.prog, 'uLightDir'); // Directional light
        this.uShininess  = gl.getUniformLocation(this.prog, 'uShininess');// Shininess for specular highlights

        this.uSampler = gl.getUniformLocation(this.prog, 'uSampler'); // Texture sampler

        // Initialize default state
        this.texture = null; // No texture
        this.numTriangles = 0; // No triangles
	}
	
	  //  Load and upload the mesh data into GPU buffers
	setMesh( vertPos, texCoords, normals )
	{
		
		this.numTriangles = vertPos.length / 3;// Every 3 vertices = 1 triangle
		

       // retrieve Vertex positions for rendering geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Upload texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Upload normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram(this.prog);
        gl.uniform1i(this.uSwapYZ, swap);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram(this.prog);

        // Bind vertex position buffer and setup attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aPosition);
		// Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
        gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aTexCoord);
		//  Bind normal buffer for lighting
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.aNormal);

        // Send transformation matrices to shaders
        gl.uniformMatrix4fv(this.uMatrixMVP, false, matrixMVP);
        gl.uniformMatrix4fv(this.uMatrixMV, false, matrixMV);
        gl.uniformMatrix3fv(this.uMatrixNormal, false, matrixNormal);

        // Bind texture if available
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.uSampler, 0);
        }

        // Draw the triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		// Set texture sampling parameters 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.bindTexture(gl.TEXTURE_2D, null);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{// Enable or disable texture usage during shading
		gl.useProgram(this.prog);
        gl.uniform1i(this.uUseTexture, show);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		gl.useProgram(this.prog);
        gl.uniform3f(this.uLightDir, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		gl.useProgram(this.prog);
        gl.uniform1f(this.uShininess, shininess);
	}
    // -------- Vertex Shader Source --------
    vertexShaderSource() {
        return `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        attribute vec3 aNormal;

        uniform mat4 uMatrixMVP;
        uniform mat4 uMatrixMV;
        uniform mat3 uMatrixNormal;
        uniform bool uSwapYZ;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vec3 pos = aPosition;
            vec3 norm = aNormal;
            if (uSwapYZ) {
                pos = pos.yxz;
                norm = norm.yxz;
            }
            gl_Position = uMatrixMVP * vec4(pos, 1.0);
            vTexCoord = aTexCoord;
            vNormal = normalize(uMatrixNormal * norm);
            vPosition = vec3(uMatrixMV * vec4(pos, 1.0));
        }`;
    }

    // -------- Fragment Shader Source --------
    fragmentShaderSource() {
        return `
        precision mediump float;

        uniform bool uUseTexture;
        uniform sampler2D uSampler;
        uniform vec3 uLightDir;
        uniform float uShininess;

        varying vec2 vTexCoord;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vec3 N = normalize(vNormal);
            vec3 L = normalize(uLightDir);
            vec3 V = normalize(-vPosition);
            vec3 H = normalize(L + V);

            float diff = max(dot(N, L), 0.0);
            float spec = pow(max(dot(N, H), 0.0), uShininess);

            vec3 kd = uUseTexture ? texture2D(uSampler, vTexCoord).rgb : vec3(1.0);
            vec3 ks = vec3(1.0);

            vec3 color = kd * diff + ks * spec;
            gl_FragColor = vec4(color, 1.0);
        }`;
    }	
}

// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, mass, gravity, restitution) {
	const forces = Array(positions.length).fill().map(() => new Vec3(0, 0, 0));

	// 1. Apply spring and damping forces
	for (let s of springs) {
		let p0 = positions[s.p0];
		let p1 = positions[s.p1];
		let v0 = velocities[s.p0];
		let v1 = velocities[s.p1];

		let dir = p0.sub(p1);
		let dist = dir.len();
		let norm = dir.unit();

		let springForce = norm.mul(-stiffness * (dist - s.rest));
		let dampingForce = v0.sub(v1).mul(-damping);

		forces[s.p0].inc(springForce.add(dampingForce));
		forces[s.p1].dec(springForce.add(dampingForce));
	}

	// 2. Add gravity
	for (let i = 0; i < positions.length; i++) {
		forces[i].inc(gravity.mul(mass));
	}

	// 3. Integrate (semi-implicit Euler)
	for (let i = 0; i < positions.length; i++) {
		let acc = forces[i].div(mass);
		velocities[i].inc(acc.mul(dt));
		positions[i].inc(velocities[i].mul(dt));

		// 4. Handle collisions with cube walls
		for (let axis of ['x', 'y', 'z']) {
			if (positions[i][axis] < -1) {
				positions[i][axis] = -1;
				if (velocities[i][axis] < 0) velocities[i][axis] *= -restitution;
			}
			if (positions[i][axis] > 1) {
				positions[i][axis] = 1;
				if (velocities[i][axis] > 0) velocities[i][axis] *= -restitution;
			}
		}
	}
}


