# Unit 테스트 규칙

## Meta

```yaml
scope: testType=unit
inherits: _common.md
priority: 1
```

---

## 1. 적용 조건

> 다음 조건을 만족할 때 본 문서 적용:
> - CLI에서 `--type unit` 옵션 사용
> - 또는 대상 파일이 `.ts`, `.js` 확장자 (비-컴포넌트)

---

## 2. 공통 규칙 관계

### Override

| Rule ID | 공통 규칙 | 본 문서 규칙 | 사유 |
|---------|----------|-------------|------|
| SEL-001 | Selector 우선순위 | 적용 안 함 | DOM 요소 없음 |
| ASYNC-001 | findBy/waitFor 패턴 | 적용 안 함 | 렌더링 없음 |

### Add

- [UNIT-001] 순수 함수 테스트 규칙
- [UNIT-002] 훅 테스트 규칙
- [UNIT-003] 유틸리티 테스트 규칙
- [UNIT-004] 엣지 케이스 규칙
- [UNIT-005] 타입 테스트 규칙

---

## 3. 주제 특화 규칙

### 3.1 순수 함수 테스트 [UNIT-001]

<!-- TODO: 입력-출력 검증, 부작용 없음 확인 -->

### 3.2 훅 테스트 [UNIT-002]

<!-- TODO: renderHook 사용, act 래핑, 상태 변화 검증 -->

### 3.3 유틸리티 테스트 [UNIT-003]

<!-- TODO: 포맷터, 파서, 변환 함수 테스트 패턴 -->

### 3.4 엣지 케이스 [UNIT-004]

#### 3.4.1 경계값 테스트 (Boundary Testing)

**날짜/시간, 숫자 범위 등을 다루는 함수는 경계값에서 오프바이원 에러가 발생하기 쉽습니다.**

```
MUST: 각 기간/범위의 시작과 끝 경계값을 명시적으로 테스트
MUST: 경계 바로 직전/직후 값도 테스트
SHOULD: 실패 메시지에 'exact start of', 'exact end of' 등으로 의도 명시
```

```typescript
// ✅ Good: 연도 경계값 테스트
const m = dayjs(new Date(2011, 3, 2))

// 정확한 경계값
expect(m.isSame(dayjs(new Date(2011, 0, 1, 0, 0, 0, 0)), 'year'))
  .toBe(true, 'exact start of year')
expect(m.isSame(dayjs(new Date(2011, 11, 31, 23, 59, 59, 999)), 'year'))
  .toBe(true, 'exact end of year')

// 경계 직후/직전
expect(m.isSame(dayjs(new Date(2012, 0, 1, 0, 0, 0, 0)), 'year'))
  .toBe(false, 'start of next year')
expect(m.isSame(dayjs(new Date(2010, 11, 31, 23, 59, 59, 999)), 'year'))
  .toBe(false, 'end of previous year')
```

```typescript
// ❌ Bad: 일반 케이스만 테스트 - 경계에서 오프바이원 에러를 놓칠 수 있음
expect(m.isSame(dayjs(new Date(2011, 5, 15)), 'year')).toBe(true)
```

#### 출처
- 원본: dayjs
- 파일: `comparison.test.js:41-44, 56-59, 72-77`
- 채택 점수: 10/10

---

#### 3.4.2 유효하지 않은 입력 테스트 (Invalid Input Testing)

**모든 public API는 유효하지 않은 입력에 대한 동작을 명시적으로 테스트해야 합니다.**

```
MUST: null, undefined, NaN, Infinity 등 invalid 입력 테스트
MUST: 빈 문자열, 빈 객체, 잘못된 타입 입력 테스트
MUST: isValid() 또는 에러 핸들링 동작 검증
```

```typescript
// ✅ Good: 다양한 invalid 입력 테스트
it('rejects invalid values', () => {
  expect(dayjs({}).isValid()).toBe(false)
  expect(dayjs(() => '2018-01-01').isValid()).toBe(false)
  expect(dayjs(Infinity).isValid()).toBe(false)
  expect(dayjs(NaN).isValid()).toBe(false)
})

it('handles null input correctly', () => {
  expect(dayjs(null).isSame(dayjs('2018-01-01')))
    .toBe(false, 'invalid moments are not considered equal')
})
```

```typescript
// ❌ Bad: 정상 케이스만 테스트 - 예외 상황 처리를 검증하지 않음
it('creates dayjs', () => {
  expect(dayjs('2018-01-01').isValid()).toBe(true)
})
```

#### 출처
- 원본: dayjs
- 파일: `parse.test.js:68-74, 92-102`, `comparison.test.js:157-160`
- 채택 점수: 10/10

---

#### 3.4.3 DST(일광 절약 시간) 테스트

**날짜/시간 연산 테스트에서 DST 전환 시점을 명시적으로 테스트해야 합니다.**

```
MUST: DST 전환 날짜를 주석으로 명시
SHOULD: 다양한 타임존의 DST를 테스트
SHOULD: DST 기간을 가로지르는 diff 연산 테스트
```

```typescript
// ✅ Good: DST 날짜를 주석으로 명시
it('Add Time days (DST)', () => {
  // change timezone before running test
  // New Zealand (-720) DST transition
  expect(dayjs('2018-04-01').add(1, 'd').format())
    .toBe(moment('2018-04-01').add(1, 'd').format())
})

it('UTC diff in DST', () => {
  // DST ends on 2020-10-25
  const day1 = dayjs.utc('20201023') // in DST
  const day2 = dayjs.utc('20201026') // out of DST
  expect(day1.diff(day2, 'd')).toBe(-3)
})
```

```typescript
// ❌ Bad: DST 영향을 고려하지 않음
it('Add day', () => {
  // DST 전환일에 실패할 수 있음
  expect(dayjs('2018-04-01').add(1, 'd').hour()).toBe(0)
})
```

#### 출처
- 원본: dayjs
- 파일: `timezone.test.js:18-26, 32-43, 67-74`
- 채택 점수: 9/10

### 3.5 타입 테스트 [UNIT-005]

<!-- TODO: 타입 추론 검증, expectTypeOf 사용 -->

---

## 4. Anti-patterns

| 패턴 | 문제점 | 대안 |
|------|--------|------|
| - | - | - |

---

## 5. Self-Check

```
□ [UNIT-001] 함수의 모든 분기가 테스트되었는가?
□ [UNIT-002] 훅 테스트에 renderHook을 사용했는가?
□ [UNIT-003] 엣지 케이스(null, undefined, 빈값)가 포함되었는가?
□ [UNIT-004] 예외 발생 시나리오가 테스트되었는가?
□ [UNIT-004] 경계값(시작/끝)이 테스트되었는가?
□ [UNIT-004] DST 전환 시점이 고려되었는가? (날짜/시간 함수)
□ [UNIT-005] 반환 타입이 올바른지 검증했는가?
```

---

## 6. Quick Reference

```typescript
// TODO: Unit 테스트 자주 쓰는 패턴
```
