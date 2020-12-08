import World from './world.js'
import components from './components.js'

let _ecs


export default class ECS {

	constructor(options) {
		if (_ecs) {
			throw new Error(`ECS is a singleton that already exists`)
		}
		_ecs = this
		_init.call(this, options)
		this.world = new World(options)
		this.components = components
	}
}


function _init(options) {
	if (options) {
		if (options['components']) {
			const componentsOption = options['components']
			if (Array.isArray(componentsOption)) {
				components.$registerComponents(componentsOption)
			} else {
				console.error(`Unexpected value for options.components`) // TODO: Better error handling
			}
		}
	}
}