export function isObject(o) {
	return o && typeof o === 'object' && !Array.isArray(o)
}