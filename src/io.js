import { is, kTrue, TASK, check } from './utils'


export const CALL_FUNCTION_ARG_ERROR = "io.call first argument must be a function"
export const CPS_FUNCTION_ARG_ERROR = "io.cps first argument must be a function"
export const FORK_ARG_ERROR = "io.fork first argument must be a generator function or an iterator"
export const JOIN_ARG_ERROR = "io.join argument must be a valid task (a result of io.fork)"

const IO    = Symbol('IO')

const TAKE  = 'TAKE'
const PUT   = 'PUT'
const RACE  = 'RACE'
const CALL  = 'CALL'
const CPS   = 'CPS'
const FORK  = 'FORK'
const JOIN  = 'JOIN'

const effect = (type, payload) => ({ [IO]: true, [type]: payload })

const matchers = {
  wildcard  : () => kTrue,
  default   : pattern => input => input.type === pattern,
  array     : patterns => input => patterns.some( p => p === input.type ),
  predicate : predicate => input => predicate(input)
}

export function matcher(pattern) {
  return (
      pattern === '*'   ? matchers.wildcard
    : is.array(pattern) ? matchers.array
    : is.func(pattern)  ? matchers.predicate
    : matchers.default
  )(pattern)
}

export default {
  take  : pattern => effect(TAKE, is.undef(pattern) ? '*' : pattern),
  put   : ac => effect(PUT, ac),
  race  : effects => effect(RACE, effects),

  call(fn, ...args) {
    check(fn, is.func, CALL_FUNCTION_ARG_ERROR)
    return effect(CALL, { fn, args })
  },

  cps(fn, ...args) {
    check(fn, is.func, CPS_FUNCTION_ARG_ERROR)
    return effect(CPS,{ fn, args })
  },

  fork(task, ...args) {
    if(!is.generator(task) && !is.iterator(task))
      throw new Error(FORK_ARG_ERROR)

    return effect(FORK, { task, args })
  },

  join(taskDesc) {
    if(!taskDesc[TASK])
      throw new Error(JOIN_ARG_ERROR)

    return effect(JOIN, taskDesc)
  },
}

export const as = {
  take  : effect => effect && effect[IO] && effect[TAKE],
  put   : effect => effect && effect[IO] && effect[PUT],
  race  : effect => effect && effect[IO] && effect[RACE],
  call  : effect => effect && effect[IO] && effect[CALL],
  cps   : effect => effect && effect[IO] && effect[CPS],
  fork  : effect => effect && effect[IO] && effect[FORK],
  join  : effect => effect && effect[IO] && effect[JOIN]
}