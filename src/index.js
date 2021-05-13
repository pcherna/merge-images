// Defaults
const defaultOptions = {
	format: 'image/png',
	quality: 0.92,
	scale: 1.0,
	width: undefined,
	height: undefined,
	Canvas: undefined,
	crossOrigin: undefined
};

// Return Promise
const mergeImages = (sources = [], options = {}) => new Promise(resolve => {
	options = Object.assign({}, defaultOptions, options);

	// Setup browser/Node.js specific variables
	const canvas = options.Canvas ? new options.Canvas() : window.document.createElement('canvas');
	const Image = options.Image || window.Image;

	// Load sources
	const images = sources.map(source => new Promise((resolve, reject) => {
		// Convert sources to objects
		if (source.constructor.name !== 'Object') {
			source = { src: source };
		}

		// Resolve source and img when loaded
		const img = new Image();
		img.crossOrigin = options.crossOrigin;
		img.onerror = () => reject(new Error('Couldn\'t load image'));
		img.onload = () => resolve(Object.assign({}, source, { img }));
		img.src = source.src;
	}));

	// Get canvas context
	const ctx = canvas.getContext('2d');

	// When sources have loaded
	resolve(Promise.all(images)
		.then(images => {
			// Set canvas dimensions
			const getSize = dim => options[dim] || Math.max(...images.map(image => image.img[dim]));
			canvas.width = getSize('width');
			canvas.height = getSize('height');

			// Draw images to canvas
			images.forEach(image => {
		ctx.globalAlpha = image.opacity ? image.opacity : 1;

		let drawImage;
		if (image.rotate || image.scale != 1.0) {
			const x = image.x ? image.x + canvas.width / 2 : canvas.width / 2;
			const y = image.y ? image.y + canvas.height / 2 : canvas.height / 2;
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(image.rotate * Math.PI / 180);
			ctx.scale(image.scale, image.scale)
			ctx.translate(-x, -y);
			drawImage = ctx.drawImage(image.img, image.x || 0, image.y || 0);
			ctx.restore();
		} else {
			drawImage = ctx.drawImage(image.img, image.x || 0, image.y || 0);
		}

		return drawImage;
	});

			if (options.Canvas && options.format === 'image/jpeg') {
				// Resolve data URI for node-canvas jpeg async
				return new Promise((resolve, reject) => {
					canvas.toDataURL(options.format, {
						quality: options.quality,
						progressive: false
					}, (err, jpeg) => {
						if (err) {
							reject(err);
							return;
						}
						resolve(jpeg);
					});
				});
			}

			// Resolve all other data URIs sync
			return canvas.toDataURL(options.format, options.quality);
		}));
});

export default mergeImages;
