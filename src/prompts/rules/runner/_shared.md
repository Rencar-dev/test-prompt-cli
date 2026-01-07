# 테스트 러너 공통 규칙

## Meta

```yaml
scope: testRunner=jest|vitest
inherits: _common.md
priority: 1.5
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - project-manifest.yaml의 testRunner가 jest 또는 vitest

---

## 2. 공통 규칙 목록

- [RUNNER-001] expect 실패 메시지 제공
- [RUNNER-002] mockClear로 단계별 호출 검증
- [RUNNER-003] expect.any(Type)으로 타입 검증
- [RUNNER-004] toMatchInlineSnapshot 제한적 사용

---

## 3. 공통 Assertion 패턴

### 3.1 expect 실패 메시지 제공 [RUNNER-001]

**expect의 두 번째 인자로 실패 시 표시될 설명을 추가하면 디버깅 시간이 대폭 단축됩니다.**

```
MUST: 유사한 assertion이 여러 개인 테스트에서 실패 메시지 제공
SHOULD: 모든 assertion에 실패 메시지 추가 권장
```

```typescript
// ✅ Good: 실패 원인을 즉시 파악 가능
expect(m.isSame(dayjs(new Date(2012, 3, 2)))).toBe(false, 'year is later')
expect(m.isSame(dayjs(new Date(2010, 3, 2)))).toBe(false, 'year is earlier')
expect(m.isSame(dayjs(new Date(2011, 4, 2)))).toBe(false, 'month is later')

// ✅ Good: 경계값 테스트 시 의미 명시
expect(m.isSame(startOfYear, 'year')).toBe(true, 'exact start of year')
expect(m.isSame(endOfYear, 'year')).toBe(true, 'exact end of year')
```

```typescript
// ❌ Bad: 어떤 케이스가 실패했는지 알 수 없음
expect(m.isSame(dayjs(new Date(2012, 3, 2)))).toBe(false)
expect(m.isSame(dayjs(new Date(2010, 3, 2)))).toBe(false)
expect(m.isSame(dayjs(new Date(2011, 4, 2)))).toBe(false)
```

#### 출처
- 원본: dayjs
- 파일: `comparison.test.js:16-32`, `display.test.js:25-27`
- 채택 점수: 10/10

---

### 3.2 mockClear로 단계별 호출 횟수 검증 [RUNNER-002]

**동일 테스트 내에서 단계별로 호출 횟수를 검증할 때 mockClear로 이전 호출을 초기화합니다.**

```
MUST: 단계별 호출 횟수 검증 시 mockClear 사용
MUST: mockClear 후 새로 발생한 호출만 검증

MUST NOT: 누적 호출 횟수로 검증 (혼란 유발)
```

```typescript
// ✅ Good: mockClear로 이전 호출 제거
render(<Counter />)
expect(effectCb).toHaveBeenCalledTimes(1)

effectCb.mockClear()  // Jest, Vitest 모두 동일
fireEvent.click(buttonNode)
expect(effectCb).toHaveBeenCalledTimes(1)  // 정확히 1번만
```

```typescript
// ❌ Bad: 누적 호출 횟수 (암시적)
render(<Counter />)
expect(effectCb).toHaveBeenCalledTimes(1)

fireEvent.click(buttonNode)
expect(effectCb).toHaveBeenCalledTimes(2)  // 1 + 1 = 2 (헷갈림)
```

#### 출처
- 원본: react-testing-library
- 파일: `act.js:31-34`, `new-act.js:31-39`
- 채택 점수: 10/10

---

### 3.3 expect.any(Type)으로 타입 검증 [RUNNER-003]

**값의 정체성이 아닌 타입만 검증할 때 expect.any(Type)을 사용합니다.**

```
MUST: 함수 존재 여부만 확인할 때 expect.any(Function) 사용
SHOULD: 객체 내 특정 필드 타입 검증에 활용

MUST NOT: 불필요한 값 동일성 검증
```

```typescript
// ✅ Good: 함수 타입만 검증
expect(result.current).toEqual([2, expect.any(Function)])
expect(result.current).toEqual(['left', expect.any(Function)])

// ✅ Good: 객체 일부 필드 타입 검증
expect(onCaughtError).toHaveBeenCalledWith(thrownError, {
  componentStack: expect.any(String),
  errorBoundary: expect.any(Object),
})
```

```typescript
// ❌ Bad: 불필요한 함수 동일성 검증
const setState = result.current[1]
expect(result.current[1]).toBe(setState)  // 불필요
```

#### 출처
- 원본: react-testing-library
- 파일: `renderHook.js:21`, `renderHook.js:46`
- 채택 점수: 10/10

---

### 3.4 toMatchInlineSnapshot은 복잡한 구조에만 사용 [RUNNER-004]

**인라인 스냅샷은 복잡한 DOM 구조나 mock 호출 인자 검증에 제한적으로 사용합니다.**

> 적용 조건: 복잡한 구조 검증 시만

```
SHOULD: 복잡한 DOM 구조, mock 호출 인자에 제한적 사용
MUST NOT: 단순 값 검증에 스냅샷 사용
```

```typescript
// ✅ Good: 복잡한 DOM 구조
expect(container.firstChild).toMatchInlineSnapshot(`
  <div
    data-testid=wrapper
  >
    <div
      data-testid=inner
    />
  </div>
`)

// ✅ Good: mock 호출 인자
expect(console.error.mock.calls).toMatchInlineSnapshot(`
  [
    [
      "call console.error",
    ],
  ]
`)
```

```typescript
// ❌ Bad: 단순 값 검증
expect(count).toMatchInlineSnapshot(`1`)

// ✅ Better
expect(count).toBe(1)
```

#### 출처
- 원본: react-testing-library
- 파일: `debug.js:44-49`, `render.js:103-111`
- 채택 점수: 7/10 (부분 채택)

---

## 4. 공통 Mock 정리 패턴

### 4.1 afterEach에서 Mock 정리

```typescript
// Jest
afterEach(() => {
  jest.clearAllMocks()    // 호출 기록 초기화
  jest.restoreAllMocks()  // spyOn 복원
})

// Vitest
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
```

---

## 5. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| 누적 호출 횟수로 검증 | 계산 필요, 실수 유발 | mockClear 후 검증 |
| 단순 값에 스냅샷 사용 | 과도한 도구 사용 | toBe, toEqual 사용 |
| 함수 동일성 검증 | 불필요한 결합 | expect.any(Function) |
| 실패 메시지 누락 | 디버깅 시간 증가 | 두 번째 인자로 설명 |

---

## 6. Self-Check

```
□ [RUNNER-001] 유사한 assertion에 실패 메시지를 제공했는가?
□ [RUNNER-002] 단계별 호출 검증 시 mockClear를 사용했는가?
□ [RUNNER-003] 함수 타입 검증 시 expect.any(Function)을 사용했는가?
□ [RUNNER-004] 스냅샷을 복잡한 구조에만 제한적으로 사용했는가?
□ afterEach에서 mock을 정리(clearAllMocks, restoreAllMocks)했는가?
```
