module.exports = (options = {}) => {
	let status = options.status || {
		success: {
			code: 200,
			message: 'success'
		},
		missing_param: {
			code: 434,
			message: 'param missing'
		}
	}
	let router = options.router || require('express').Router();
	let missingValidator;
	if (options.missingValidator) {
		missingValidator = options.missingValidator;
	} else {
		missingValidator = (param) => !param;
	}
	let onMissingParam;
	if (options.onMissingParam) {
		onMissingParam = options.onMissingParam;
	} else {
		onMissingParam = (param, req, res) => {
			if (status.missing_param) {
				res.status(status.missing_param.code);
				res.json(status.missing_param);
			} else {
				res.status(400);
				res.end();
			}
			return false;
		}
	}
	return {
		router,
		/**
		 * @name Handlers
		 * @function
		 * @param {Request} req
		 * @param {Response} res
		 * @param {Array<Object>} status
		 * @param {Function} next
		 */
		/**
		 * @param {{
		 *     path: String,
		 *     params: Array<String>
		 * }} opt
		 * @param {Handlers} handlers
		 */
		post: (opt, handlers) => {
			let params = opt.params || [];
			let path = opt.path || '';
			if (params && !Array.isArray(params)) {
				throw new Error('requireParams must be a type of array.');
			}
			router.post(path, (req, res, next) => {
				let isMissing = false;
				params.forEach((p) => {
					if (missingValidator(req.body[p])) {
						let val = onMissingParam(p, req, res);
						isMissing = !val;
					}
				});
				if (isMissing) return;
				let obj = {};
				Object.keys(status).forEach(key => {
					obj[key] = (data) => {
						res.status(status[key].code);
						if (!data)
							data = {};
						res.json({
							...status[key],
							...data,
						});
					};
				})
				res.sendJson = obj;
				handlers(req, res, next);
			});
		},
	}
}