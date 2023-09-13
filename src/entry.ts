import { inject, injectable, multiInject, named, tagged } from 'inversify';
import {
    AbstractComponent,
    AbstractComponentConfiguration,
    COMPONENT_TYPE,
    IOC,
    metadata
} from './bind';

@injectable()
abstract class InjectableClass {}

interface PassThrough {
    message: string;
}

interface Weapon {}

interface BladedWeapon extends Weapon {}

@AbstractComponent()
export class Katana extends InjectableClass implements BladedWeapon {}

@AbstractComponent()
export class Stick extends InjectableClass implements Weapon {}

@AbstractComponent<PassThrough>({
    tag: [{ metadataKey: 'yes', metadataValue: 'anything' }],
    data: { message: 'Hello World!' }
})
export class Wololoo extends InjectableClass implements Weapon {}

@AbstractComponent({
    componentType: 'Custom',
    componentName: 'Test',
    tag: [{ metadataKey: 'Entry', metadataValue: true }]
})
export class Example1 extends InjectableClass {
    constructor(
        @multiInject(COMPONENT_TYPE)
        component: Weapon[],
        @multiInject(COMPONENT_TYPE)
        @tagged('yes', 'anything')
        taggedComponent: Weapon[],
        @inject(COMPONENT_TYPE)
        @named(Stick.name)
        stick: Stick
    ) {
        super();
        console.log('OUTPUT______');
        component.forEach((entry) => {
            console.log('multiInject', entry.constructor.name);
        });
        taggedComponent.forEach((entry) => {
            const info: AbstractComponentConfiguration<PassThrough> =
                metadata.readMetadata<
                    AbstractComponentConfiguration<PassThrough>
                >(entry.constructor);
            console.log('tagged multiInject', entry.constructor.name, info);
        });
        console.log('inject named', stick.constructor.name);
    }
}
// same objects
const tagClass = IOC.container.getTagged('Custom', 'Entry', true);
const nameClass = IOC.container.getNamed('Custom', 'Test');

console.log(
    'Finally, activation once',
    tagClass.constructor.name,
    nameClass.constructor.name
);

//output
// activation of Katana
// activation of Stick
// activation of Wololoo
// OUTPUT______
// multiInject Katana
// multiInject Stick
// multiInject Wololoo
// multiInject tagged Wololoo {
//   componentName: 'Wololoo',
//   tag: [ { metadataKey: 'yes', metadataValue: 'notUsed' } ],
//   data: { message: 'Hello World!' }
// }
// inject named Stick
// activation of Example1
// Finally, activation once Example1 Example1
