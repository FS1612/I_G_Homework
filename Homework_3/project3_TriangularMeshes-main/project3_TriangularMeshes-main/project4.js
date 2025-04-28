// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
/**
 * Creates a 4x4 transformation matrix combining rotation, translation, and projection.
 * This matrix transforms 3D model coordinates into screen space.
 *
 * @param {number[]} projectionMatrix - The 4x4 projection matrix (column-major format).
 * @param {number} translationX - Move the object left/right.
 * @param {number} translationY - Move the object up/down.
 * @param {number} translationZ - Move the object forward/backward.
 * @param {number} rotationX - Rotate around the X-axis (in radians).
 * @param {number} rotationY - Rotate around the Y-axis (in radians).
 * @returns {number[]} - The final combined transformation matrix.
 */
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	// Rotation around X-axis
	var cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
	var rotX = [
		1, 0, 0, 0,
		0, cosX, sinX, 0,
		0, -sinX, cosX, 0,
		0, 0, 0, 1
	];

	// Rotation around Y-axis
	var cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
	var rotY = [
		cosY, 0, -sinY, 0,
		0, 1, 0, 0,
		sinY, 0, cosY, 0,
		0, 0, 0, 1
	];

	// Translation
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	// Multiply the matrices: projection * translation * rotationY * rotationX

	var mvp = MatrixMult(rotY, rotX); // Apply rotations
	mvp = MatrixMult(trans, mvp);	  // Apply translation
	mvp = MatrixMult(projectionMatrix, mvp); // Apply projection
	return mvp;
}
// This vertex shader transforms each vertex of the 3D model.
// It also allows swapping Y and Z axes if needed.
var meshVS = `
	attribute vec3 position;   // 3D position of each vertex
	attribute vec2 texCoord;   // 2D texture coordinates
	uniform mat4 mvp;		   // Model-View-Projection matrix
	uniform bool swap;		   // Should we swap Y and Z axes?
	varying vec2 vTexCoord;    // Pass texture coordinates to the fragment shader
	void main() {
		vec3 pos = position;
		// Optionally swap Y and Z coordinates
		if (swap)
			pos = vec3(pos.x, pos.z, pos.y);
		// Calculate the screen-space position of the vertex
		gl_Position = mvp * vec4(pos, 1.0);
		// Pass texture coordinate to fragment shader
		vTexCoord = texCoord;
	}
`;

// This fragment shader decides the final color of each pixel.
var meshFS = `
	precision mediump float;  
	varying vec2 vTexCoord;				// Texture coordinates from vertex shader
	uniform sampler2D texture;			// 2D texture image
	uniform bool showTex;				// Should we show the texture?
	void main() {
		if (showTex)
			gl_FragColor = texture2D(texture, vTexCoord);		// Use texture color
		else
			gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);	// Depth-based color
	}
`;



class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		//meshVS:vertex shader str
		// Initializes the shader program, buffers, and textureing
		//meshFS:fragment shader string
		this.prog = InitShaderProgram(meshVS, meshFS);
		// Create buffers for vertex positions and texture coordinates
		this.vertPosBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		// Get locations of uniforms and attributes from the shader
		this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
		this.swapLoc = gl.getUniformLocation(this.prog, "swap");
		this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");
		this.positionLoc = gl.getAttribLocation(this.prog, "position");
		this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");
		// Create an empty texture object
		this.texture = gl.createTexture();
	}

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	/**
	 * Loads the mesh data into GPU buffers.
	 * Called when the user loads a new .obj file.
	 */
	setMesh(vertPos, texCoords) {
		// Upload vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		// Upload texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		// Each triangle has 3 vertices
		this.numTriangles = vertPos.length / 3;
	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.

	/**
	 * Enables or disables Y-Z axis swapping.
	 * Called when the "Swap Y-Z Axes" checkbox is toggled.
	 */
	swapYZ(swap) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapLoc, swap ? 1 : 0);
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.


	/**
	 * Draws the mesh on screen using the given transformation matrix.
	 */
	draw(trans) {
		gl.useProgram(this.prog);
		// Pass the transformation matrix
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
		// Enable and bind vertex positions
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertPosBuffer);
		gl.enableVertexAttribArray(this.positionLoc);
		gl.vertexAttribPointer(this.positionLoc, 3, gl.FLOAT, false, 0, 0);
		// Enable and bind texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
		// Bind the texture
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		// Draw the triangles
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	/**
	 * Loads an image into the GPU as a texture.
	 * Called when the user uploads a new texture image.
	 */
	setTexture(img) {
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	}

	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	/**
	 * Shows or hides the texture on the mesh.
	 * Called when the "Show Texture" checkbox is toggled.
	 */
	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show ? 1 : 0);
	}


}
