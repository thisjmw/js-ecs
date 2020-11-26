import manager from './manager.js'
import components from './components.js'


function init(options) {
	manager.init(options)

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


const ecs = {
	manager,
	components,
	init
}

export default ecs