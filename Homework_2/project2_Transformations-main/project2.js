// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
	let rad = rotation * Math.PI / 180;
	let cos = Math.cos(rad);
	let sin = Math.sin(rad);

	//To obtain the desired Transformation we need to multiply the transformation starting from the last one
	let m00 = cos * scale;
	let m01 = sin * scale;
	let m10 = -sin * scale;
	let m11 = cos * scale;

	let tx = positionX;
	let ty = positionY;


	return [
		m00, m01, 0,
		m10, m11, 0,
		tx,  ty,  1
	];
}


// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
	let result = new Array(9);

	for (let row = 0; row < 3; ++row) {
		for (let col = 0; col < 3; ++col) {
			let sum = 0;
			for (let k = 0; k < 3; ++k) {
				// Row-major math done using column-major indices
				sum += trans2[k * 3 + row] * trans1[col * 3 + k];
			}
			result[col * 3 + row] = sum;
		}
	}

	return result;
}
