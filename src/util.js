export function isObject(o) {
	return o && typeof o === 'object' && !Array.isArray(o)
}


export function singleOrDefault(array, filterFn, defaultValue = null) {
	const matchedValues = array.filter(filterFn)
	return matchedValues.length ? matchedValues[0] : defaultValue
}