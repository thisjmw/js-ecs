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
			const entityId = entity.id
			entity.getComponent(ecs.components.collision).entities = []

			const othersCollidingWithThisEntity = entitiesColliding
				.filter(pair => pair.includes(entityId))
				.map(pair => pair.find(id => id !== entityId))

			const transform = entity.getComponent(ecs.components.transform)
			const colliderGeometry = entity.getComponent(ecs.components.colliderGeometry)

			// Loop over other entities that haven't already been `entity` in the main loop
			for (let e = i++; e < entities.length; e++) {
				const other = entities[e]
				const otherId = other.id
				const otherTransform = other.getComponent(ecs.components.transform)
				const otherColliderGeometry = other.getComponent(ecs.components.colliderGeometry)

				let colliding = othersCollidingWithThisEntity.includes(otherId)
				if (!colliding) {
					colliding = colliderGeometry.isColliding(transform, otherColliderGeometry, otherTransform)
				}

				if (colliding) {
					othersCollidingWithThisEntity.push(otherId)
					entitiesColliding.push([entityId, otherId])
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
			const collidingEntityIds = entity.getComponent(ecs.components.collision).entities
			if (collidingEntityIds.length) {
				const entityId = entity.id
				for (const otherId of collidingEntityIds) {
					if (!handledCollisions.find(pair => pair.includes(entityId) && pair.includes(otherId))) {
						console.log(`Entity [${entityId}] is colliding with entity [${otherId}]`)
						handledCollisions.push([entityId, otherId])
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
