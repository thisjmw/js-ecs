import * as blueprints from './componentBlueprints.js'
import { isObject } from './util.js'

const $components = {
	transform: (props) => _createComponent('transform', props),
	health: (props) => _createComponent('health', props)
}

const componentBlueprints = { ...blueprints }


function _createComponent(componentName, props) {
	if (!Object.hasOwnProperty.call(componentBlueprints, componentName)) {
		throw new Error(`No component blueprint defined for component "${componentName}"`)
	}

	const component = Object.create(componentBlueprints[componentName].proto)

	if (props) {
		if (!isObject(props)) {
			console.error('Expected an object for component props; got this instead:', props)
		} else {
			for (const propKey in props) {
				if (Object.hasOwnProperty.call(props, propKey) && typeof props[propKey] !== typeof void 0) {
					component[propKey] = props[propKey]
				}
			}
		}
	}

	const defaults = componentBlueprints[componentName].defaults
	for (const propKey in defaults) {
		if (Object.hasOwnProperty.call(defaults, propKey) && !Object.hasOwnProperty.call(component, propKey)) {
			component[propKey] = defaults[propKey]
		}
	}

	return component
}


function $registerComponent(componentDefinition) {
	if (!isObject(componentDefinition)) {
		console.error(`Expected an object for component definition; got this instead:`, componentDefinition)
		throw new TypeError(`Invalid component definition object`)
	}

	const symbolNameRegex = /^[a-zA-Z$_]+[a-zA-z$_\d]*$/
	const name = componentDefinition['name']
	if (!(name && symbolNameRegex.test(name))) {
		throw new Error(`Invalid or missing component name: ${name}`)
	}
	if (Object.hasOwnProperty.call($components, name)) {
		throw new Error(`Component "${name}" already exists`)
	}
	if (Object.hasOwnProperty.call(componentBlueprints, name)) {
		throw new Error(`Component "${name}" blueprint already exists`)
	}

	const defaults = componentDefinition['defaults']
	if (!isObject(defaults)) {
		throw new TypeError(`Invalid or missing component defaults object`)
	}

	const methods = componentDefinition['methods']
	if (methods) {
		if (!isObject(methods)) {
			throw new TypeError(`Invalid component methods object`)
		}
		for (const methodKey in methods) {
			if (Object.hasOwnProperty.call(methods, methodKey) && typeof methods[methodKey] !== 'function') {
				throw new TypeError(`Component methods object can only contain functions`)
			}
		}
	}

	_makeComponentBlueprint(name, defaults, methods)

	// Ensures that function is given proper name
	$components[name] = {[name](props) { return _createComponent(name, props) }}[name]

	return $components[name]
}


function $registerComponents(componentDefinitionsArray) {
	if (!(componentDefinitionsArray && Array.isArray(componentDefinitionsArray))) {
		throw new Error(`Invalid or missing component definitions array`)
	}
	for (const componentDefinition of componentDefinitionsArray) {
		$registerComponent(componentDefinition)
	}
}


function _makeComponentBlueprint(name, defaults, methods) {
	const proto = { type: name }
	if (methods) {
		for (const methodKey in methods) {
			if (Object.hasOwnProperty.call(methods, methodKey)) {
				proto[methodKey] = methods[methodKey]
			}
		}
	}

	componentBlueprints[name] = {
		proto,
		defaults
	}
}


const components = $components

Object.defineProperty(components, '$registerComponent', {
	value: $registerComponent
})

Object.defineProperty(components, '$registerComponents', {
	value: $registerComponents
})

export default components