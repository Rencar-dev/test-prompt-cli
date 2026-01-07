# 시간 Mock 규칙

## Meta

```yaml
scope: mock=time
inherits: _common.md
priority: 2
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - MockDate, jest.useFakeTimers, vi.useFakeTimers 등 시간 mocking 라이브러리 사용 시
> - Date, setTimeout, setInterval 등 시간 의존적 테스트 작성 시

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| - | - | - | - |

### Add

- [TIME-001] beforeEach/afterEach 격리 규칙
- [TIME-002] MockDate 사용 규칙

---

## 3. 주제 특화 규칙

### 3.1 beforeEach/afterEach로 시간 Mock 격리 [TIME-001]

**시간 의존적 테스트는 beforeEach/afterEach로 Mock을 설정/해제하여 테스트 간 격리를 보장합니다.**

```
MUST: beforeEach에서 시간 Mock 설정
MUST: afterEach에서 시간 Mock 해제 (reset/restore)
MUST NOT: 테스트 내부에서만 Mock 설정 후 정리 안 함
MUST NOT: describe 밖에서 전역으로 Mock 설정
```

```typescript
// ✅ Good: 매 테스트마다 시간 초기화
import MockDate from 'mockdate'

describe('DateUtils', () => {
  beforeEach(() => {
    MockDate.set(new Date('2011-01-15'))
  })

  afterEach(() => {
    MockDate.reset()
  })

  it('is same year', () => {
    const m = dayjs(new Date(2011, 1, 2, 3, 4, 5, 6))
    expect(m.isSame(dayjs(), 'year')).toBe(true)
  })

  it('is different year', () => {
    const m = dayjs(new Date(2012, 1, 2))
    expect(m.isSame(dayjs(), 'year')).toBe(false)
  })
})
```

```typescript
// ❌ Bad: 테스트 간 상태 공유, 순서 의존성 발생
describe('DateUtils', () => {
  it('is same year', () => {
    MockDate.set(new Date('2011-01-15'))
    const m = dayjs()
    // MockDate.reset() 누락 - 다음 테스트에 영향
  })

  it('is different year', () => {
    // 이전 테스트의 MockDate 상태가 남아있을 수 있음
    const m = dayjs()
  })
})
```

#### Jest/Vitest Fake Timers

```typescript
// ✅ Good: Jest/Vitest fake timers 패턴
beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2011-01-15'))
})

afterEach(() => {
  jest.useRealTimers()
})

// ✅ Good: Vitest 패턴
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2011-01-15'))
})

afterEach(() => {
  vi.useRealTimers()
})
```

#### 출처
- 원본: dayjs
- 파일: `comparison.test.js:4-10`, `display.test.js:7-13`, `timezone.test.js:10-16`
- 채택 점수: 9/10
- 채택 사유: 재현가능성, 유지보수성, AI친화성 우수

---

### 3.2 시간 고정 vs 상대 시간 [TIME-002]

**테스트 목적에 따라 절대 시간 고정과 상대 시간 패턴을 구분합니다.**

```
SHOULD: 특정 날짜 검증 시 절대 시간 고정 (MockDate.set)
SHOULD: 시간 경과 검증 시 상대 시간 (advanceTimersByTime)
MUST NOT: 현재 시간(Date.now())에 직접 의존하는 assertion
```

```typescript
// ✅ Good: 절대 시간 고정 - 특정 날짜 검증
beforeEach(() => {
  MockDate.set(new Date('2020-10-25')) // DST 종료일
})

it('handles DST transition', () => {
  expect(dayjs().add(1, 'day').format('YYYY-MM-DD')).toBe('2020-10-26')
})
```

```typescript
// ✅ Good: 상대 시간 - 시간 경과 검증
beforeEach(() => {
  jest.useFakeTimers()
})

it('debounces input', async () => {
  const callback = jest.fn()
  const debounced = debounce(callback, 300)

  debounced()
  expect(callback).not.toHaveBeenCalled()

  jest.advanceTimersByTime(300)
  expect(callback).toHaveBeenCalledTimes(1)
})
```

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| 전역 MockDate 설정 | 테스트 간 상태 공유 | beforeEach/afterEach 사용 |
| reset 누락 | 다음 테스트 오염 | afterEach에서 항상 reset |
| Date.now() 직접 사용 | 실행 시점에 따라 결과 변경 | MockDate로 고정 |

---

## 5. Self-Check

```
□ [TIME-001] beforeEach에서 시간 Mock을 설정하는가?
□ [TIME-001] afterEach에서 시간 Mock을 해제하는가?
□ [TIME-002] Date.now()에 직접 의존하지 않는가?
□ [TIME-002] DST 전환 시점이 테스트에 영향을 주지 않는가?
```

---

## 6. Quick Reference

```typescript
// MockDate 패턴
import MockDate from 'mockdate'

beforeEach(() => MockDate.set(new Date('2011-01-15')))
afterEach(() => MockDate.reset())

// Jest fake timers 패턴
beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2011-01-15'))
})
afterEach(() => jest.useRealTimers())

// Vitest fake timers 패턴
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2011-01-15'))
})
afterEach(() => vi.useRealTimers())
```
