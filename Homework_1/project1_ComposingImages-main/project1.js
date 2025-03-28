// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos)
{
    const bgData = bgImg.data;
    const fgData = fgImg.data;

    const bgWidth = bgImg.width;
    const bgHeight = bgImg.height;

    const fgWidth = fgImg.width;
    const fgHeight = fgImg.height;

    for (let y = 0; y < fgHeight; y++) {
        const bgY = y + fgPos.y;
        if (bgY < 0 || bgY >= bgHeight) continue;

        for (let x = 0; x < fgWidth; x++) {
            const bgX = x + fgPos.x;
            if (bgX < 0 || bgX >= bgWidth) continue;

            const fgIndex = (y * fgWidth + x) * 4;
            const bgIndex = (bgY * bgWidth + bgX) * 4;

            const fgAlpha = fgData[fgIndex + 3] * fgOpac / 255;
            const bgAlpha = bgData[bgIndex + 3] / 255;
            const outAlpha = fgAlpha + bgAlpha * (1 - fgAlpha);

            if (outAlpha === 0) continue;

            for (let c = 0; c < 3; c++) {
                const fgColor = fgData[fgIndex + c];
                const bgColor = bgData[bgIndex + c];
                const outColor = (fgColor * fgAlpha + bgColor * bgAlpha * (1 - fgAlpha)) / outAlpha;
                bgData[bgIndex + c] = Math.round(outColor);
            }

            bgData[bgIndex + 3] = Math.round(outAlpha * 255);
        }
    }
}
