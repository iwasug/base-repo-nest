import { circularToJSON } from 'helpers';
import { RepositoryModule } from 'repository.module';
import { addOptions } from 'sequelize-typescript';

import CacheUtility, { CacheKey } from './cache-utilty';


async function invalidateCache(model, options, { name, caches }: { name: string, caches: CacheKey[] }) {
  console.log('model', model);
  console.log('keys', caches);

  const previousModel = { ...model['dataValues'], ...circularToJSON(model['_previousDataValues']) }

  console.log('previousModel', previousModel);
  if (options?.transaction) {
    options.transaction.afterCommit(() => {
      invalidationCache(previousModel, { name, caches })
    })
    console.log('hooks after update transaction');
    return model
  }
  invalidationCache(previousModel, { name, caches })
  console.log('hooks after update');
  return model

}

function annotate(target, options: { hooks }) {
  addOptions(target.prototype, options)
}

function getWhereOptions(previousModel, attributes: readonly string[]) {
  return attributes.reduce((result: object, current: string): object => {
    const currentPropValue = previousModel[current]

    if (currentPropValue == undefined)
      throw new Error(`${[current]} value is missing`)

    return {
      ...result,
      [current]: previousModel[current]
    }
  }, {})
}

async function invalidationCache(previousModel, { name: modelName, caches }: { name: string, caches: CacheKey[] }) {
  return caches.map(async ({ name: cacheName, attributes }) => {
    const whereOptions = getWhereOptions(previousModel, attributes)
    console.log(cacheName, whereOptions);
    const whereOptionsString = CacheUtility.setQueryOptions({ where: whereOptions })
    const key = CacheUtility.setKey(modelName, whereOptionsString, cacheName)

    const invalidation = RepositoryModule.cacheInvalidate;
    return await invalidation({ key })
  })

}


export function Cache(target): void {
  const options: { hooks } = Object.assign({},
    {
      hooks: {
        afterUpdate: async (instance, options) => {
          console.log('instance', instance);
          return await invalidateCache(instance, options, target)
        },
        afterDestroy: async (instance, options) => {
          return await invalidateCache(instance, options, target)
        },
        beforeBulkUpdate: function (options) {
          options.individualHooks = true;
        }
      },
    });

  console.log('cache2');
  annotate(target, options);
}