export const transform = {
	proto: { $type: 'transform' },
	defaults: {
		position: {
			x: 0,
			y: 0
		},
		scale: 1,
		rotation: 0
	}
}

export const health = {
	proto: { $type: 'health' },
	defaults: { value: 100 }
}


export const collision = {
	proto: { $type: 'collision' },
	defaults: {
		entities: []
	}
}


export const colliderGeometry = {
	proto: {
		$type: 'colliderGeometry',
		isColliding(selfTransform, otherColliderGeometry, otherTransform) {
			let colliding = false
			for (const selfCollisionShape of this.colliders) {
				if (colliding) break
				for (const otherCollisionShape of otherColliderGeometry.colliders) {
					if (colliding) break
					colliding = selfCollisionShape.isColliding(selfTransform, otherCollisionShape, otherTransform)
				}
			}
			return colliding
		}
	},
	defaults: {
		colliders: []
	}
}


export const colliderCircle = {
	proto: {
		$type: 'colliderCircle',
		isColliding(selfTransform, otherCollider, otherTransform) {
			const x = selfTransform.position.x + (this.offset.x * selfTransform.scale)
			const y = selfTransform.position.y + (this.offset.y * selfTransform.scale)
			const otherX = otherTransform.position.x + (otherCollider.offset.x * otherTransform.scale)
			const otherY = otherTransform.position.y + (otherCollider.offset.y * otherTransform.scale)
			const radius = this.radius * selfTransform.scale
			const otherRadius = otherCollider.radius * otherTransform.scale

			switch (otherCollider.$type) {
				case 'colliderCircle':
					return (x - otherX) ** 2 + (y - otherY) ** 2 <= (radius + otherRadius) ** 2
				default:
					return false
			}
		}
	},
	defaults: {
		radius: 1,
		offset: {
			x: 0,
			y: 0
		}
	}
}