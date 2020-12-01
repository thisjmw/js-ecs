import ECS from './src/ecs.js'

const ecs = new ECS()

ecs.manager.createEntity([
	ecs.components.transform
])

ecs.manager.createEntity([
	ecs.components.transform({
		position: {
			x: 33,
			y: 22
		}
	}),
	ecs.components.health
])

print(ecs.manager.entities)

ecs.manager.removeComponent(2, 2)

print(ecs.manager.entities)

ecs.manager.removeEntity(1)
ecs.manager.$clean()

print(ecs.manager.entities)
print(ecs.manager.components)


function print(obj) {
	console.log(JSON.stringify(obj, null, 2))
}
