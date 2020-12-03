import ECS from './src/ecs.js'

const ecs = new ECS()


ecs.manager.systems.registerSystem(
	'adjacent_entities',
	ecs.manager.queries.registerQuery('transform', [ecs.components.transform]),
	function adjacentEntitiesSystem(entities) {
		const matched = []
		let i = 1
		for (const entity of entities) {
			const pos = entity.getComponent(ecs.components.transform).position
			for (let e = i; e < entities.length; e++) {
				const other = entities[e]
				if (other !== entity) {
					const otherPos = other.getComponent(ecs.components.transform).position
					if (Math.abs(pos.x - otherPos.x) + Math.abs(pos.y - otherPos.y) <= 1) {
						if (!(matched.find(pair => pair.includes(entity) && pair.includes(other)))) {
							matched.push([entity, other])
						}
					}
				}
			}
			i++
		}

		for (const match of matched) {
			const e1pos = match[0].getComponent(ecs.components.transform).position
			const e2pos = match[1].getComponent(ecs.components.transform).position
			console.log(`Entities [${match[0].id}] and [${match[1].id}] are neighbors: (${e1pos.x}, ${e1pos.y}) (${e2pos.x}, ${e2pos.y})`)
		}
	})

ecs.manager.systems.registerSystem(
	'all_entities',
	ecs.manager.queries.getQuery('$GLOBAL'),
	function allEntitiesSystem(entities, time) {
		for (const entity of entities) {
			console.log(`Entity [${entity.id}] exists at [t=${time}]`)
		}
	})


ecs.manager.createEntity([
	ecs.components.transform({
		position: {
			x: 32,
			y: 22
		}
	})
])

ecs.manager.createEntity([
	ecs.components.transform({
		position: {
			x: 33,
			y: 22
		}
	})
])

ecs.manager.createEntity([
	ecs.components.transform({
		position: {
			x: 34,
			y: 22
		}
	})
])

ecs.manager.createEntity([
	ecs.components.transform({
		position: {
			x: 35,
			y: 23
		}
	})
])

let iter = 0
let interval = setInterval(() => {
	if (iter >= 5) {
		clearInterval(interval)
	} else {
		ecs.manager.systems.run(Date.now())
		iter++
	}
}, 1000 / 60)


function print(obj) {
	console.log(JSON.stringify(obj, null, 2))
}
