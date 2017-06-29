const assert = require('assert')
const Automerge = require('../src/Automerge')
const { equalsOneOf } = require('./helpers')

describe('Automerge proxy API', () => {
  describe('root object', () => {
    it('should have a fixed object ID', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.strictEqual(doc._type, 'map')
        assert.strictEqual(doc._objectId, '00000000-0000-0000-0000-000000000000')
      })
    })

    it('should know its actor ID', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(doc._actorId))
        assert.notEqual(doc._actorId, '00000000-0000-0000-0000-000000000000')
        assert.strictEqual(Automerge.init('customActorId')._actorId, 'customActorId')
      })
    })

    it('should expose keys as object properties', () => {
      Automerge.changeset(Automerge.init(), doc => {
        doc.key1 = 'value1'
        assert.strictEqual(doc.key1, 'value1')
        assert.strictEqual(doc['key1'], 'value1')
      })
    })

    it('should return undefined for unknown properties', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.strictEqual(doc.someProperty, undefined)
        assert.strictEqual(doc['someProperty'], undefined)
      })
    })

    it('should support the "in" operator', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.strictEqual('key1' in doc, false)
        doc.key1 = 'value1'
        assert.strictEqual('key1' in doc, true)
      })
    })

    it('should support Object.keys()', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.deepEqual(Object.keys(doc), ['_objectId'])
        doc.key1 = 'value1'
        equalsOneOf(Object.keys(doc), ['_objectId', 'key1'], ['key1', '_objectId'])
        doc.key2 = 'value2'
        equalsOneOf(Object.keys(doc),
          ['_objectId', 'key1', 'key2'], ['_objectId', 'key2', 'key1'],
          ['key1', '_objectId', 'key2'], ['key2', '_objectId', 'key1'],
          ['key1', 'key2', '_objectId'], ['key2', 'key1', '_objectId'])
      })
    })

    it('should support Object.getOwnPropertyNames()', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.deepEqual(Object.getOwnPropertyNames(doc), ['_objectId'])
        doc.key1 = 'value1'
        equalsOneOf(Object.getOwnPropertyNames(doc), ['_objectId', 'key1'], ['key1', '_objectId'])
        doc.key2 = 'value2'
        equalsOneOf(Object.getOwnPropertyNames(doc),
          ['_objectId', 'key1', 'key2'], ['_objectId', 'key2', 'key1'],
          ['key1', '_objectId', 'key2'], ['key2', '_objectId', 'key1'],
          ['key1', 'key2', '_objectId'], ['key2', 'key1', '_objectId'])
      })
    })

    it('should support JSON.stringify()', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.deepEqual(JSON.stringify(doc), '{"_objectId":"00000000-0000-0000-0000-000000000000"}')
        doc.key1 = 'value1'
        equalsOneOf(JSON.stringify(doc),
          '{"_objectId":"00000000-0000-0000-0000-000000000000","key1":"value1"}',
          '{"key1":"value1","_objectId":"00000000-0000-0000-0000-000000000000"}')
        doc.key2 = 'value2'
        assert.deepEqual(JSON.parse(JSON.stringify(doc)), {
          _objectId: '00000000-0000-0000-0000-000000000000', key1: 'value1', key2: 'value2'
        })
      })
    })

    it('should allow inspection as regular JS objects', () => {
      Automerge.changeset(Automerge.init(), doc => {
        assert.deepEqual(doc._inspect, {_objectId: '00000000-0000-0000-0000-000000000000'})
        assert.deepEqual(Automerge.inspect(doc), {_objectId: '00000000-0000-0000-0000-000000000000'})
        doc.key1 = 'value1'
        assert.deepEqual(doc._inspect, {_objectId: '00000000-0000-0000-0000-000000000000', key1: 'value1'})
        assert.deepEqual(Automerge.inspect(doc), {_objectId: '00000000-0000-0000-0000-000000000000', key1: 'value1'})
        doc.key2 = 'value2'
        assert.deepEqual(doc._inspect, {
          _objectId: '00000000-0000-0000-0000-000000000000', key1: 'value1', key2: 'value2'
        })
        assert.deepEqual(Automerge.inspect(doc), {
          _objectId: '00000000-0000-0000-0000-000000000000', key1: 'value1', key2: 'value2'
        })
      })
    })
  })

  describe('list object', () => {
    let root
    beforeEach(() => {
      root = Automerge.changeset(Automerge.init(), doc => { doc.list = [1, 2, 3]; doc.empty = [] })
    })

    it('should look like a JavaScript array', () => {
      Automerge.changeset(root, doc => {
        assert.strictEqual(Array.isArray(doc.list), true)
        assert.strictEqual(typeof doc.list, 'object')
        assert.strictEqual(toString.call(doc.list), '[object Array]')
      })
    })

    it('should have a length property', () => {
      Automerge.changeset(root, doc => {
        assert.strictEqual(doc.empty.length, 0)
        assert.strictEqual(doc.list.length, 3)
      })
    })

    it('should allow entries to be fetched by index', () => {
      Automerge.changeset(root, doc => {
        assert.strictEqual(doc.list[0],   1)
        assert.strictEqual(doc.list['0'], 1)
        assert.strictEqual(doc.list[1],   2)
        assert.strictEqual(doc.list['1'], 2)
        assert.strictEqual(doc.list[2],   3)
        assert.strictEqual(doc.list['2'], 3)
        assert.strictEqual(doc.list[3],   undefined)
        assert.strictEqual(doc.list['3'], undefined)
        assert.strictEqual(doc.list[-1],  undefined)
        assert.strictEqual(doc.list.someProperty,    undefined)
        assert.strictEqual(doc.list['someProperty'], undefined)
      })
    })

    it('should support the "in" operator', () => {
      Automerge.changeset(root, doc => {
        assert.strictEqual(0 in doc.list, true)
        assert.strictEqual('0' in doc.list, true)
        assert.strictEqual(3 in doc.list, false)
        assert.strictEqual('3' in doc.list, false)
        assert.strictEqual('length' in doc.list, true)
        assert.strictEqual('someProperty' in doc.list, false)
      })
    })

    it('should support Object.keys()', () => {
      Automerge.changeset(root, doc => {
        assert.deepEqual(Object.keys(doc.list), ['0', '1', '2'])
      })
    })

    it('should support Object.getOwnPropertyNames()', () => {
      Automerge.changeset(root, doc => {
        assert.deepEqual(Object.getOwnPropertyNames(doc.list), ['length', '_objectId', '0', '1', '2'])
      })
    })

    it('should support JSON.stringify()', () => {
      Automerge.changeset(root, doc => {
        assert.deepEqual(JSON.parse(JSON.stringify(doc)), {
          _objectId: '00000000-0000-0000-0000-000000000000', list: [1, 2, 3], empty: []
        })
        assert.deepEqual(JSON.stringify(doc.list), '[1,2,3]')
      })
    })

    it('should allow inspection as regular JS objects', () => {
      Automerge.changeset(root, doc => {
        assert.deepEqual(doc._inspect, {
          _objectId: '00000000-0000-0000-0000-000000000000', list: [1, 2, 3], empty: []
        })
        assert.deepEqual(Automerge.inspect(doc), {
          _objectId: '00000000-0000-0000-0000-000000000000', list: [1, 2, 3], empty: []
        })
      })
    })

    it('should support iteration', () => {
      Automerge.changeset(root, doc => {
        let copy = []
        for (let x of doc.list) copy.push(x)
        assert.deepEqual(copy, [1, 2, 3])

        // spread operator also uses iteration protocol
        assert.deepEqual([0, ...doc.list, 4], [0, 1, 2, 3, 4])
      })
    })

    describe('should support standard read-only methods', () => {
      it('concat()', () => {
        Automerge.changeset(root, doc => {
          assert.deepEqual(doc.list.concat([4, 5, 6]), [1, 2, 3, 4, 5, 6])
          assert.deepEqual(doc.list.concat([4], [5, [6]]), [1, 2, 3, 4, 5, [6]])
        })
      })

      it('entries()', () => {
        Automerge.changeset(root, doc => {
          let copy = []
          for (let x of doc.list.entries()) copy.push(x)
          assert.deepEqual(copy, [[0, 1], [1, 2], [2, 3]])
          assert.deepEqual([...doc.list.entries()], [[0, 1], [1, 2], [2, 3]])
        })
      })

      it('every()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.every(() => false), true)
          assert.strictEqual(doc.list.every(val => val > 0), true)
          assert.strictEqual(doc.list.every(val => val > 2), false)
          assert.strictEqual(doc.list.every((val, index) => index < 3), true)
          doc.list.every(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('filter()', () => {
        Automerge.changeset(root, doc => {
          assert.deepEqual(doc.empty.filter(() => false), [])
          assert.deepEqual(doc.list.filter(num => num % 2 === 1), [1, 3])
          assert.deepEqual(doc.list.filter(num => true), [1, 2, 3])
          doc.list.filter(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('find()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.find(() => true), undefined)
          assert.strictEqual(doc.list.find(num => num >= 2), 2)
          assert.strictEqual(doc.list.find(num => num >= 4), undefined)
          doc.list.find(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('findIndex()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.findIndex(() => true), -1)
          assert.strictEqual(doc.list.findIndex(num => num >= 2), 1)
          assert.strictEqual(doc.list.findIndex(num => num >= 4), -1)
          doc.list.findIndex(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('forEach()', () => {
        Automerge.changeset(root, doc => {
          doc.empty.forEach(() => { assert.fail('was called', 'not called', 'callback error') })
          let binary = []
          doc.list.forEach(num => binary.push(num.toString(2)))
          assert.deepEqual(binary, ['1', '10', '11'])
          doc.list.forEach(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('includes()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.includes(3), false)
          assert.strictEqual(doc.list.includes(3), true)
          assert.strictEqual(doc.list.includes(1, 1), false)
          assert.strictEqual(doc.list.includes(2, -2), true)
          assert.strictEqual(doc.list.includes(0), false)
        })
      })

      it('indexOf()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.indexOf(3), -1)
          assert.strictEqual(doc.list.indexOf(3), 2)
          assert.strictEqual(doc.list.indexOf(1, 1), -1)
          assert.strictEqual(doc.list.indexOf(2, -2), 1)
          assert.strictEqual(doc.list.indexOf(0), -1)
        })
      })

      it('join()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.join(', '), '')
          assert.strictEqual(doc.list.join(), '1,2,3')
          assert.strictEqual(doc.list.join(''), '123')
          assert.strictEqual(doc.list.join(', '), '1, 2, 3')
        })
      })

      it('keys()', () => {
        Automerge.changeset(root, doc => {
          let keys = []
          for (let x of doc.list.keys()) keys.push(x)
          assert.deepEqual(keys, [0, 1, 2])
          assert.deepEqual([...doc.list.keys()], [0, 1, 2])
        })
      })

      it('lastIndexOf()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.lastIndexOf(3), -1)
          assert.strictEqual(doc.list.lastIndexOf(3), 2)
          assert.strictEqual(doc.list.lastIndexOf(3, 1), -1)
          assert.strictEqual(doc.list.lastIndexOf(3, -1), 2)
          assert.strictEqual(doc.list.lastIndexOf(0), -1)
        })
      })

      it('map()', () => {
        Automerge.changeset(root, doc => {
          assert.deepEqual(doc.empty.map(num => num * 2), [])
          assert.deepEqual(doc.list.map(num => num * 2), [2, 4, 6])
          assert.deepEqual(doc.list.map((num, index) => index + '->' + num), ['0->1', '1->2', '2->3'])
          doc.list.map(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('reduce()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.reduce((sum, val) => sum + val, 0), 0)
          assert.strictEqual(doc.list.reduce((sum, val) => sum + val, 0), 6)
          assert.strictEqual(doc.list.reduce((sum, val) => sum + val, ''), '123')
          assert.strictEqual(doc.list.reduce((sum, val) => sum + val), 6)
          assert.strictEqual(doc.list.reduce((sum, val, index) => (index % 2 === 0) ? (sum + val) : sum, 0), 4)
        })
      })

      it('reduceRight()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.reduceRight((sum, val) => sum + val, 0), 0)
          assert.strictEqual(doc.list.reduceRight((sum, val) => sum + val, 0), 6)
          assert.strictEqual(doc.list.reduceRight((sum, val) => sum + val, ''), '321')
          assert.strictEqual(doc.list.reduceRight((sum, val) => sum + val), 6)
          assert.strictEqual(doc.list.reduceRight((sum, val, index) => (index % 2 === 0) ? (sum + val) : sum, 0), 4)
        })
      })

      it('slice()', () => {
        Automerge.changeset(root, doc => {
          assert.deepEqual(doc.empty.slice(), [])
          assert.deepEqual(doc.list.slice(2), [3])
          assert.deepEqual(doc.list.slice(-2), [2, 3])
          assert.deepEqual(doc.list.slice(0, 0), [])
          assert.deepEqual(doc.list.slice(0, 1), [1])
          assert.deepEqual(doc.list.slice(0, -1), [1, 2])
        })
      })

      it('some()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.some(() => true), false)
          assert.strictEqual(doc.list.some(val => val > 2), true)
          assert.strictEqual(doc.list.some(val => val > 4), false)
          assert.strictEqual(doc.list.some((val, index) => index > 2), false)
          doc.list.some(function () { assert.strictEqual(this.hello, 'world') }, {hello: 'world'})
        })
      })

      it('toString()', () => {
        Automerge.changeset(root, doc => {
          assert.strictEqual(doc.empty.toString(), '')
          assert.strictEqual(doc.list.toString(), '1,2,3')
        })
      })

      it('values()', () => {
        Automerge.changeset(root, doc => {
          let values = []
          for (let x of doc.list.values()) values.push(x)
          assert.deepEqual(values, [1, 2, 3])
          assert.deepEqual([...doc.list.values()], [1, 2, 3])
        })
      })
    })

    describe('should support standard mutation methods', () => {
      it('fill()', () => {
        root = Automerge.changeset(root, doc => doc.list.fill('a'))
        assert.deepEqual(root.list, ['a', 'a', 'a'])
        root = Automerge.changeset(root, doc => doc.list.fill('c', 1).fill('b', 1, 2))
        assert.deepEqual(root.list, ['a', 'b', 'c'])
      })

      it('pop()', () => {
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.pop(), 3))
        assert.deepEqual(root.list, [1, 2])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.pop(), 2))
        assert.deepEqual(root.list, [1])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.pop(), 1))
        assert.deepEqual(root.list, [])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.pop(), undefined))
        assert.deepEqual(root.list, [])
      })

      it('push()', () => {
        root = Automerge.changeset(root, doc => doc.noodles = [])
        root = Automerge.changeset(root, doc => doc.noodles.push('udon', 'soba'))
        root = Automerge.changeset(root, doc => doc.noodles.push('ramen'))
        assert.deepEqual(root.noodles, ['udon', 'soba', 'ramen'])
        assert.strictEqual(root.noodles[0], 'udon')
        assert.strictEqual(root.noodles[1], 'soba')
        assert.strictEqual(root.noodles[2], 'ramen')
        assert.strictEqual(root.noodles.length, 3)
      })

      it('shift()', () => {
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.shift(), 1))
        assert.deepEqual(root.list, [2, 3])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.shift(), 2))
        assert.deepEqual(root.list, [3])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.shift(), 3))
        assert.deepEqual(root.list, [])
        root = Automerge.changeset(root, doc => assert.strictEqual(doc.list.shift(), undefined))
        assert.deepEqual(root.list, [])
      })

      it('splice()', () => {
        root = Automerge.changeset(root, doc => doc.list.splice(1))
        assert.deepEqual(root.list, [1])
        root = Automerge.changeset(root, doc => doc.list.splice(0, 0, 'a', 'b', 'c'))
        assert.deepEqual(root.list, ['a', 'b', 'c', 1])
        root = Automerge.changeset(root, doc => doc.list.splice(1, 2, '-->'))
        assert.deepEqual(root.list, ['a', '-->', 1])
      })

      it('unshift()', () => {
        root = Automerge.changeset(root, doc => doc.noodles = [])
        root = Automerge.changeset(root, doc => doc.noodles.unshift('soba', 'udon'))
        root = Automerge.changeset(root, doc => doc.noodles.unshift('ramen'))
        assert.deepEqual(root.noodles, ['ramen', 'soba', 'udon'])
        assert.strictEqual(root.noodles[0], 'ramen')
        assert.strictEqual(root.noodles[1], 'soba')
        assert.strictEqual(root.noodles[2], 'udon')
        assert.strictEqual(root.noodles.length, 3)
      })
    })
  })
})