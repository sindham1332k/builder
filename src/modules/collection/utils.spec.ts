import { ChainId } from '@dcl/schemas'
import * as dappsEth from 'decentraland-dapps/dist/lib/eth'
import { buildCatalystItemURN, buildThirdPartyURN } from 'lib/urn'
import { Item, WearableBodyShape } from 'modules/item/types'
import { Collection, CollectionType } from 'modules/collection/types'
import { Mint } from './types'
import { getTotalAmountOfMintedItems, isLocked, getCollectionType } from './utils'

describe('when counting the amount of minted items', () => {
  let mints: Mint[]
  let item: Item

  beforeEach(() => {
    item = { id: 'anId' } as Item
  })

  describe('having no mints', () => {
    beforeEach(() => {
      mints = []
    })

    it('should return 0', () => {
      expect(getTotalAmountOfMintedItems(mints)).toBe(0)
    })
  })

  describe('having one mint of amount 3', () => {
    beforeEach(() => {
      mints = [{ address: 'anAddress', amount: 3, item }]
    })

    it('should return 3', () => {
      expect(getTotalAmountOfMintedItems(mints)).toBe(3)
    })
  })

  describe('having two mints of amount 2', () => {
    beforeEach(() => {
      mints = [
        { address: 'anAddress', amount: 2, item },
        { address: 'anotherAddress', amount: 2, item }
      ]
    })
    it('should return 4', () => {
      expect(getTotalAmountOfMintedItems(mints)).toBe(4)
    })
  })
})

describe('when checking collection locks', () => {
  let collection: Collection

  describe('when the collection does not have a lock', () => {
    beforeEach(() => {
      collection = { lock: undefined, isPublished: false } as Collection
    })
    it('should return false', () => {
      expect(isLocked(collection)).toBe(false)
    })
  })

  describe('when the collection is published', () => {
    beforeEach(() => {
      collection = { lock: undefined, isPublished: false } as Collection
    })
    it('should return false', () => {
      expect(isLocked(collection)).toBe(false)
    })
  })

  describe('when the collection has an expired lock and is published', () => {
    beforeEach(() => {
      const lock = Date.now() - 3 * 60 * 60 * 1000 // 3 days in milliseconds
      collection = { lock, isPublished: true } as Collection
    })
    it('should return false', () => {
      expect(isLocked(collection)).toBe(false)
    })
  })

  describe('when the collection has a valid lock and is not published', () => {
    beforeEach(() => {
      const lock = Date.now() - 2 * 60 * 1000 // 2 minutes in milliseconds
      collection = { lock, isPublished: false } as Collection
    })
    it('should return true', () => {
      expect(isLocked(collection)).toBe(true)
    })
  })
})

describe('when getting the collection type', () => {
  let collection: Collection

  describe('when the collection has a base avatar URN', () => {
    beforeEach(() => {
      collection = { id: 'aCollection', urn: WearableBodyShape.FEMALE.toString() } as Collection
    })

    it('should return false', () => {
      expect(getCollectionType(collection)).toBe(CollectionType.DECENTRALAND)
    })
  })

  describe('when the collection has a collections v2 URN', () => {
    beforeEach(() => {
      jest.spyOn(dappsEth, 'getChainIdByNetwork').mockReturnValueOnce(ChainId.MATIC_MAINNET)
      collection = { id: 'aCollection', urn: buildCatalystItemURN('0xc6d2000a7a1ddca92941f4e2b41360fe4ee2abd8', '22') } as Collection
    })

    it('should return false', () => {
      expect(getCollectionType(collection)).toBe(CollectionType.DECENTRALAND)
    })
  })

  describe('when the collection has a third party URN', () => {
    beforeEach(() => {
      jest.spyOn(dappsEth, 'getChainIdByNetwork').mockReturnValueOnce(ChainId.MATIC_MAINNET)
      collection = { id: 'aCollection', urn: buildThirdPartyURN('thirdpartyname', 'collection-id', '22') } as Collection
    })

    it('should return true', () => {
      expect(getCollectionType(collection)).toBe(CollectionType.THIRD_PARTY)
    })
  })
})
