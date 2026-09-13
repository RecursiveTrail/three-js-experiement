import { describe, expect, it } from 'vitest'
import { frontPawFrame, groundBlobVisible, mushikaYaw, shrineBodyPose } from './Mushika'

describe('frontPawFrame', () => {
  it('raises paws to chest and in front of the belly while bowing at the shrine', () => {
    const left = frontPawFrame({ shrine: true, shrineT: 0.1, hopping: false, stride: 0, side: 1 })
    const right = frontPawFrame({ shrine: true, shrineT: 0.1, hopping: false, stride: 0, side: -1 })
    expect(left.rotationX).toBeCloseTo(-1.5)
    expect(right.rotationX).toBeCloseTo(-1.5)
    expect(left.rotationZ).toBeCloseTo(0.55)
    expect(right.rotationZ).toBeCloseTo(-0.55)
    expect(left.z).toBeGreaterThan(0.16)
    expect(right.z).toBeGreaterThan(0.16)
  })

  it('lifts paws off the namaste hold once the shrine dance starts', () => {
    const bow = frontPawFrame({ shrine: true, shrineT: 0.1, hopping: false, stride: 0, side: 1 })
    const dance = frontPawFrame({ shrine: true, shrineT: 0.7, hopping: false, stride: 0, side: 1 })
    expect(dance.rotationX).not.toBeCloseTo(bow.rotationX)
  })

  it('keeps the rest run pose off shrine', () => {
    const left = frontPawFrame({ shrine: false, hopping: false, stride: 1, side: 1 })
    const right = frontPawFrame({ shrine: false, hopping: false, stride: 1, side: -1 })
    expect(left.rotationX).toBeCloseTo(0.85)
    expect(right.rotationX).toBeCloseTo(-0.85)
    expect(left.rotationZ).toBe(0)
    expect(right.rotationZ).toBe(0)
    expect(left.z).toBeCloseTo(0.16)
    expect(right.z).toBeCloseTo(0.16)
  })
})

describe('groundBlobVisible', () => {
  it('hides the disc during shrine', () => {
    expect(groundBlobVisible('shrine')).toBe(false)
    expect(groundBlobVisible('playing')).toBe(true)
    expect(groundBlobVisible('opening')).toBe(true)
  })
})

describe('mushikaYaw', () => {
  it('faces down the road so the player sees her back while running and opening', () => {
    expect(mushikaYaw('playing', null)).toBeCloseTo(Math.PI)
    expect(mushikaYaw('opening', null)).toBeCloseTo(Math.PI)
    expect(mushikaYaw('over', null)).toBeCloseTo(Math.PI)
  })
})

describe('shrineBodyPose', () => {
  it('starts small, facing Ganpati, and bows', () => {
    const start = shrineBodyPose(0)
    const midBow = shrineBodyPose(0.14)
    expect(start.yaw).toBeCloseTo(Math.PI)
    expect(start.scale).toBeLessThan(0.5)
    expect(start.scale).toBeGreaterThan(0.3)
    expect(midBow.pitch).toBeGreaterThan(0.3)
    expect(midBow.yaw).toBeCloseTo(Math.PI)
  })

  it('flips around toward the player, then hops in a dance', () => {
    const flip = shrineBodyPose(0.38)
    const dance = shrineBodyPose(0.82)
    expect(flip.yaw).toBeGreaterThan(0.2)
    expect(flip.yaw).toBeLessThan(Math.PI - 0.2)
    expect(dance.scale).toBeCloseTo(shrineBodyPose(0).scale)
    expect(dance.y).toBeGreaterThan(shrineBodyPose(0).y + 0.04)
  })
})
