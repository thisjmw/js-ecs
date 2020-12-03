import System from './system.js'


let $manager
let $queryManager


export default class SystemManager {

	constructor(entityManager, queryManager) {
		$manager = entityManager
		$queryManager = queryManager
		this.systems = []
	}


	getSystem(name) { return this.systems.find(s => s.name === name) }
	getSystems() { return this.systems }


	registerSystem(name, query, systemFunction) {
		if (typeof name !== 'string') {
			throw new TypeError(`System name must be a string`)
		}
		if (this.getSystem(name)) {
			throw new Error(`System "${name}" already exists`)
		}

		if (!$queryManager.getQuery(query.name)) {
			throw new Error(`Query ${query.name} doesn't exist`)
		}

		if (typeof systemFunction !== 'function') {
			throw new TypeError(`System function must be a function`)
		}

		const system = new System(name, query, systemFunction)
		query.addSystem(system)

		this.systems.push(system)

		return system
	}


	run(time, delta) {
		this.systems.forEach(system => system.execute(time, delta))
	}
}