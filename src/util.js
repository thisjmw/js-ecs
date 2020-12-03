export function isObject(o) {
	return o && typeof o === 'object' && !Array.isArray(o)
}


export function singleOrDefault(array, filterFn, defaultValue = null) {
	const matchedValues = array.filter(filterFn)
	return matchedValues.length ? matchedValues[0] : defaultValue
}


export function isNullOrUndefined(o) {
	return o === null || typeof o === typeof void 0
}


export function getPrintableObject(o, tryProperties) {
	if (isObject(o)) {
		if (tryProperties) {
			let str
			for (let i = 0; !str && i < tryProperties.length; i++) {
				debugger
				const prop = tryProperties[i]
				if (Object.hasOwnProperty.call(o, prop)) {
					str = o[prop]
				}
			}
			return isNullOrUndefined(str) ? getPrintableObject(o) : getPrintableObject(str)
		} else {
			return JSON.stringify(o)
		}
	} else {
		if (typeof o === 'function') {
			return o.name || o
		} else {
			return o
		}
	}
}