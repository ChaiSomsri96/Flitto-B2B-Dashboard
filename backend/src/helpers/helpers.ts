const imageFilter = function (req:any, file:any, cb:any) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|tiff|TIFF|pjp|PJP|jfif|JFIF|svg|SVG|bmp|BMP|svgz|SVGZ|webp|WEBP|ico|ICO|tif|TIF|pjpeg|PJPEG|avif|AVIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!'
      return cb(null, false)
    }
    cb(null, true)
}
export default imageFilter;
