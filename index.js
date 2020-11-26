import ecs from './src/ecs.js'

ecs.init()

ecs.manager.createEntity([ecs.components.transform, ecs.components.health])
ecs.manager.createEntity([
	ecs.components.transform({
		position: { x: 33, y: 50 },
		scale: 0.5,
		rotation: Math.PI / 2
	})
])

console.log(JSON.stringify(ecs.manager.entities, null, 2))
console.log(JSON.stringify(ecs.manager.components, null, 2))