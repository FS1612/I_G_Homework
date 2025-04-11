// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos)
{   // RGBA pixel data for both background and foreground images
    const bgData = bgImg.data;
    const fgData = fgImg.data;
    // Dimensions of the background and foreground images
    const bgWidth = bgImg.width;
    const bgHeight = bgImg.height;
    
    const fgWidth = fgImg.width;
    const fgHeight = fgImg.height;
    // Loop through each pixel in the foreground image
    for (let y = 0; y < fgHeight; y++) {
        const bgY = y + fgPos.y;// Calculate the corresponding Y position in the background image
        if (bgY < 0 || bgY >= bgHeight) continue; // Skip if the Y coordinate falls outside the background bounds

        for (let x = 0; x < fgWidth; x++) {
            const bgX = x + fgPos.x; // Calculate the corresponding X position in the background image
            if (bgX < 0 || bgX >= bgWidth) continue; // Skip if the X coordinate is outside the background bounds

            // Compute index in the flat RGBA arrays
            const fgIndex = (y * fgWidth + x) * 4;
            const bgIndex = (bgY * bgWidth + bgX) * 4;

            // Read and normalize the alpha values (0–255 becomes 0–1)
            const fgAlpha = fgData[fgIndex + 3] * fgOpac / 255; // foreground alpha * global opacity
            const bgAlpha = bgData[bgIndex + 3] / 255; // background alpha

            // Compute the resulting alpha after blending the two pixels
            const outAlpha = fgAlpha + bgAlpha * (1 - fgAlpha);

            // If the resulting pixel is fully transparent, skip blending
            if (outAlpha === 0) continue;

            // Blend each color channel (R, G, B) using standard alpha compositing
            for (let c = 0; c < 3; c++) {
                const fgColor = fgData[fgIndex + c];
                const bgColor = bgData[bgIndex + c];
                const outColor = (fgColor * fgAlpha + bgColor * bgAlpha * (1 - fgAlpha)) / outAlpha;
                // Write the resulting color back to the background image
                bgData[bgIndex + c] = Math.round(outColor);
            }
            // Store the new alpha value back into the background image (rescaled to 0–255)
            bgData[bgIndex + 3] = Math.round(outAlpha * 255);
        }
    }
}
