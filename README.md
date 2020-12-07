# js-ecs

A simple entity component system written in javascript.  

**This project is still under development and is not "production-ready" yet.**


# Setup

```javascript
import ECS from './src/ecs.js'

const ecs = new ECS()
```

Certain behaviors can be configured by passing an `options` object to the `ECS` constructor.  

For example, the functions called to generate IDs for new entities or components can be defined with the 
`entityIdGenerator` and `componentIdGenerator` properties respectively. Alternatively, they can be set to use a built-in 
auto-incrementing function:

```javascript
const ecs = new ECS({
    entityIdGenerator: () => ('' + Math.random()).substring(2),
    componentIdGenerator: {
        auto: true,
        start: 1
    }
})
```

By default, entities and components will be generated with auto-incrementing IDs starting at 1.

## Application order

For best results, an application using this system should follow this order:  

1. Register component blueprints  
2. Register queries  
3. Register systems  
4. Create entities and do all other application logic  

Component blueprints must be registered before they can be used in queries, systems, or entities.  

Queries and systems could be registered after entities have already been created, but this could potentially impact 
runtime performance at the time of registration while scanning through existing entities.  


# Entities

Entities are objects with an ID and a collection of components. Entities are created with the function 
`ecs.manager.createEntity(components)`, which accepts an array of components:  

```javascript
const entity1 = ecs.manager.createEntity()

const entity2 = ecs.manager.createEntity([
    ecs.components.transform,
    ecs.components.collision,
    ecs.components.colliderGeometry({
        colliders: [ ecs.components.colliderCircle({ radius: 5 }) ]   
    })
])

console.log(entity1)  // { id: 1, components: {} }
console.log(entity2)  // { id: 2, components: { transform: {...}, collision: {...}, colliderGeometry: {...} }
```

Note that you can pass components in directly without calling them as a function, such as with 
`ecs.components.transform` and `ecs.components.collision`. These components will be created with the default values 
defined in their blueprints.  

Components can also be assigned to entities with the function `ecs.manager.assignComponent(entityId, component)`:  

```javascript
ecs.manager.assignComponent(entity1.id, ecs.components.collision)
ecs.manager.assignComponent(entity1.id, ecs.components.transform({
    position: { x: 10, y: 10 },
    scale: 1,
    rotation: 0
}))
```

## Removing entities

You can mark entities for removal with the function `ecs.manager.removeEntity(entityId)`. This will set their property 
`active` to false, but they won't be removed until `ecs.manager.$clean()` is called. This will also remove all 
components that belong to the entity.


# Components

Components are dynamically-created objects that contain data and, occasionally, helper methods. **Ideally, helper 
methods should never change any data.** Components can be accessed through `ecs.components`.

## Registering new component blueprints

The `ecs.components.$registerComponent(componentDefinition)` function can be used to register new component blueprints. 
This function will add a factory function to `ecs.components` which you can use to construct new components of that 
type.  

The `name` property of the `componentDefinition` object will be used as the factory function's name, as well as 
the `$type` property on the created component object's prototype. The `defaults` property of the `componentDefinition` 
object sets the default values for created component objects:

```javascript
ecs.components.$registerComponent({
    name: 'circle',
    defaults: {
        radius: 1
    },
    methods: {
        getArea: () => Math.PI * Math.pow(this.radius, 2)
    }
})

const newCircleComponent = ecs.components.circle({ radius: 10 })

console.log(newCircleComponent.radius)      // 10
console.log(newCircleComponent.getArea())   // 314.1592653589793
console.log(newCircleComponent.$type)       // 'circle'

const defaultCircleComponent = ecs.components.circle()

console.log(defaultCircleComponent.radius)  // 1
```

Multiple component blueprints can be created at once by passing an array of `componentDefinition` objects to the plural 
 `ecs.manager.$registerComponents(componentDefinitionsArray)` function:
 
 ```javascript
ecs.components.$registerComponents([
    { name: 'foo', defaults: { text: 'there was a hole here' } },
    { name: 'bar', defaults: { text: 'it\'s gone now' } },
    { name: 'biz', defaults: { n: 100 }, methods: { baz: () => this.n * this.n } }
])
```


# Queries

Queries keep track of all entities that contain a combination of components. They deliver these entities to systems that 
are registered with the query. Queries can be registered with the function 
`ecs.manager.queries.registerQuery(name, components)`:  

```javascript
// Keeps track of all entities that contain a `transform` component
ecs.manager.queries.registerQuery('transform', [ ecs.components.transform ])

// All entities that contain `transform`, `collision`, and `colliderGeometry` components
ecs.manager.queries.registerQuery('collision', [
    ecs.components.transform,
    ecs.components.collision,
    ecs.components.colliderGeometry
])

ecs.manager.createEntity([ ecs.components.transform ])  // id: 1

ecs.manager.createEntity([                              // id: 2
    ecs.components.transform,
    ecs.components.collision,
    ecs.components.colliderGeometry,
    ecs.components.someOtherComponent
])

console.log(ecs.manager.queries.getQuery('transform').entities)  // [{... id: 1}, {... id: 2}]
console.log(ecs.manager.queries.getQuery('collision').entities)  // [{... id: 2}]
```

There is also a default `$GLOBAL` query which contains all entities.  


# Systems
Systems are responsible for all behavior. They are functions that receive an array of entities that are matched by 
a query, and optionally they can receive `time` and `deltaTime`. Systems can be registered with the function 
`ecs.manager.systems.registerSystem(name, query, systemFunction)`:  

```javascript
ecs.manager.registerSystem(
    'list_entities_system',
    ecs.manager.queries.getQuery('$GLOBAL'),
    function listEntitiesSystem(entities) {
        for (const entity of entities) {
            console.log(`Entity ${entity.id} exists!`)
        }
    }
)

ecs.manager.registerSystem(
    'collision_system',
    ecs.manager.queries.getQuery('collision'), // <-- registered above in Queries section
    function collisionSystem(entities, time, delta) {
        for (const entity of entities) {
            const transform = entity.getComponent(ecs.components.transform)
            const colliders = entity.getComponent(ecs.components.colliderGeometry).colliders
            // do collision stuff here
        }
    }
)

ecs.manager.registerSystem(
    'move_right_system',
    // Queries can be registered at the time of registering systems, too:
    ecs.manager.queries.registerQuery('position', [ecs.components.transform]),
    function badMoveRightSystem(entities) {
        for (const entity of entities) {
            const position = entity.getComponent(ecs.components.transform).position
            position.x += 1
        }
    } 
)
```

To run all systems, call `ecs.manager.systems.run(time, delta)`. This will run each system **in the order in which it 
was registered**. Each system will receive its `entities` from the query it was registered with, and it will receive 
`time` and `delta` from the values passed to `run(time, delta)`.