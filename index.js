import ECS from './src/ecs.js'

const ecs = new ECS()


let circles = []


class TestCircle {
	constructor(x, y, radius) {
		this.x = x
		this.y = y
		this.radius = radius
		this.entity = ecs.world.createEntity([

			ecs.components.transform({
				position: {
					x: this.x,
					y: this.y
				},
				scale: 1
			}),

			ecs.components.collision,

			ecs.components.colliderGeometry({
				colliders: [
					ecs.components.colliderCircle({
						radius: this.radius
					})
				]
			})
		])
	}

	destroy() {
		ecs.world.removeEntity(this.entity.id)
	}
}


ecs.world.systems.registerSystem(
	'collision_system',
	ecs.world.queries.$registerQuery('collision', [
		ecs.components.transform,
		ecs.components.collision,
		ecs.components.colliderGeometry
	]),
	function collisionSystem(entities) {
		const entitiesColliding = []
		let i = 1
		for (const entity of entities) {
			entity.getComponent(ecs.components.collision).entities = []

			const othersCollidingWithThisEntity = entitiesColliding
				.filter(pair => pair.includes(entity))
				.map(pair => pair.find(e => e !== entity))

			const transform = entity.getComponent(ecs.components.transform)
			const colliderGeometry = entity.getComponent(ecs.components.colliderGeometry)

			// Loop over other entities that haven't already been `entity` in the main loop
			for (let e = i++; e < entities.length; e++) {
				const other = entities[e]
				const otherTransform = other.getComponent(ecs.components.transform)
				const otherColliderGeometry = other.getComponent(ecs.components.colliderGeometry)

				let colliding = !!othersCollidingWithThisEntity.includes(other)
				if (!colliding) {
					colliding = colliderGeometry.isColliding(transform, otherColliderGeometry, otherTransform)
				}

				if (colliding) {
					othersCollidingWithThisEntity.push(other)
					entitiesColliding.push([entity, other])
				}
			}

			entity.getComponent(ecs.components.collision).entities = othersCollidingWithThisEntity
		}
	}
)


ecs.world.systems.registerSystem(
	'collision_reader_system',
	ecs.world.queries.$registerQuery('collision_reader', [ecs.components.collision]),
	function collisionReaderSystem(entities) {
		const handledCollisions = []

		for (const entity of entities) {
			const collidingEntities = entity.getComponent(ecs.components.collision).entities
			if (collidingEntities.length) {
				for (const other of collidingEntities) {
					if (!handledCollisions.find(pair => pair.includes(entity) && pair.includes(other))) {
						console.log(`Entity [${entity.id}] is colliding with entity [${other.id}]`)
						handledCollisions.push([entity, other])
					}
				}
			}
		}
	}
)


ecs.world.systems.registerSystem(
	'cleanup_system',
	ecs.world.queries['$GLOBAL'],
	function cleanupSystem() {
		circles.forEach(circle => circle.destroy())
		ecs.world.$clean()
	}
)


import { randomInt } from './src/util.js'

for (let i = 0; i < 50; i++) {
	circles.push(new TestCircle(randomInt(10, 50), randomInt(10, 50), randomInt(1, 10)))
}

ecs.world.systems.run()




function print(obj) {
	console.log(JSON.stringify(obj, null, 2))
}
