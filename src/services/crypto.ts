import { timingSafeEqual } from 'crypto'

export function safeCompare(a: string, b: string): boolean {
  const aLen = Buffer.byteLength(a)
  const bLen = Buffer.byteLength(b)
  const aBuf = Buffer.alloc(aLen, 0, 'utf8')
  aBuf.write(a)
  const bBuf = Buffer.alloc(aLen, 0, 'utf8')
  bBuf.write(b)
  return !!(timingSafeEqual(aBuf, bBuf) && aLen === bLen)
}
