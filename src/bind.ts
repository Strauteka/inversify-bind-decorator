import 'reflect-metadata';
import { BindingScopeEnum, interfaces, Container } from 'inversify';

export const COMPONENT_TYPE = Symbol.for('ServiceComponentType');

export const IOC = {
    container: new Container({
        defaultScope: BindingScopeEnum.Singleton,
        skipBaseClassChecks: false
    })
};

export interface Constr<T> {
    new (...args: any[]): T;
}

export interface AbstractComponentConfiguration<T> {
    componentType?: symbol | string;
    componentName?: string;
    tag?: { metadataKey: string | number | symbol; metadataValue: unknown }[];
    data?: T;
}

export const metadata = {
    writeMetadata: <T, C>(target: Constr<T>, cfg: C): void => {
        target['___META_DATA___'] = cfg;
    },

    readMetadata: <T>(target: any): T => {
        return target['___META_DATA___'];
    }
};

export const AbstractComponent = <T>(
    config?: AbstractComponentConfiguration<T>
) => {
    return <T extends Constr<Object>>(constructor: T) => {
        const cfg = {
            componentName: constructor.name,
            ...config
        };
        metadata.writeMetadata(constructor, cfg);
        bindComponent(cfg, constructor);
        return constructor;
    };
};

export const bindComponent = <R extends Object>(
    configuration: AbstractComponentConfiguration<unknown>,
    reference: Constr<R>
) => {
    IOC.container
        .bind<R>(configuration.componentType || COMPONENT_TYPE)
        .to(reference)
        .when((request: interfaces.Request) => {
            const named = request.target.getNamedTag();

            const classMetadata =
                metadata.readMetadata<AbstractComponentConfiguration<unknown>>(
                    request.bindings[0].implementationType
                ) || {};
            const tagMatch = (classMetadata.tag || []).some((cfg) =>
                request.target.matchesTag(cfg.metadataKey)(cfg.metadataValue)
            );

            const name = (named || {}).value || classMetadata.componentName;
            const result =
                ((request.target.getCustomTags() || []).length == 0 &&
                    name === classMetadata.componentName) ||
                tagMatch;
            return result;
        })
        .onActivation((context: interfaces.Context, injectable: R) => {
            console.log('activation of', injectable.constructor.name);
            return injectable;
        });
};
