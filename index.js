import ECS from './src/ecs.js'

const ecs = new ECS()

ecs.manager.queries.registerQuery('transform', [ecs.components.transform])
ecs.manager.queries.registerQuery('health', [ecs.components.health])
ecs.manager.queries.registerQuery('health_and_transform', [
	ecs.components.health,
	ecs.components.transform
])

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

print(ecs.manager.queries.all)

ecs.manager.removeComponent(2, 2)

print(ecs.manager.queries.all)
print(ecs.manager.queries.byComponent)

ecs.manager.removeEntity(1)
ecs.manager.$clean()

print(ecs.manager.queries.all)

ecs.manager.reset()

print(ecs.manager.queries.all)

ecs.manager.queries.reset()

print(ecs.manager.queries.all)



function print(obj) {
	console.log(JSON.stringify(obj, null, 2))
}
