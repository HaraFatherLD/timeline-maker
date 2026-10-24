// Original sample content: a short outline of ancient Greek history, in Korean.
import { createTimeline, addEra, addEvent } from './model.js';

const TITLE = '고대 그리스 연표';
const SUBTITLE = '청동기 시대의 크레타에서 로마의 지배까지, 약 3천 년의 흐름';

const ERAS = [
  {
    name: '청동기 시대: 미노아와 미케네',
    period: '기원전 3000년경 ~ 기원전 1100년경',
    description: '에게해 일대에서 청동 도구와 궁전 중심의 경제가 발달한 시기. 크레타 섬의 미노아 문명과 그리스 본토의 미케네 문명이 차례로 번성했다.',
    events: [
      { date: '기원전 1900년경', title: '크노소스 궁전 건설', description: '크레타 섬 크노소스에 큰 궁전이 세워져 미노아 문명의 중심지가 되었다. 궁전은 지진으로 무너졌다가 다시 지어졌다.' },
      { date: '기원전 1600년경', title: '미케네 문명의 성장', description: '펠로폰네소스 반도의 미케네와 티린스, 필로스 등지에 성채와 왕궁이 들어서고, 선형 B 문자로 행정 기록을 남겼다.' },
      { date: '기원전 1200년경', title: '청동기 시대 말의 붕괴', description: '여러 궁전이 파괴되고 선형 B 문자가 사라지면서 미케네 세계의 질서가 무너졌다. 원인은 지금도 논쟁 중이다.' },
    ],
  },
  {
    name: '암흑기와 폴리스의 탄생',
    period: '기원전 1100년경 ~ 기원전 800년경',
    description: '문자 기록이 드물어 암흑기라고 불리는 시기. 이 기간을 거치며 작은 공동체들이 독자적인 도시국가, 곧 폴리스로 자리를 잡아 갔다.',
    events: [
      { date: '기원전 8세기 초', title: '그리스 알파벳의 확산', description: '페니키아 문자를 바탕으로 모음까지 적는 그리스 알파벳이 만들어져 널리 퍼졌다.' },
      { date: '기원전 776년', title: '첫 올림피아 제전', description: '전통적으로 올림피아 경기가 처음 열린 해로 전해진다. 이후 4년마다 열리며 폴리스들을 하나의 문화권으로 묶는 구실을 했다.' },
    ],
  },
  {
    name: '아르카이크 시대',
    period: '기원전 800년경 ~ 기원전 500년경',
    description: '폴리스가 성장하고 지중해와 흑해 연안에 식민시를 세운 시기. 귀족정과 참주정을 거치며 시민의 참여를 넓히는 제도 실험이 이어졌다.',
    events: [
      { date: '기원전 8세기 중반 이후', title: '식민 활동', description: '인구가 늘고 땅이 모자라자 그리스인들이 남이탈리아와 시칠리아, 흑해 연안 등으로 나아가 새 도시를 세웠다.' },
      { date: '기원전 594년', title: '솔론의 개혁', description: '아테네의 솔론이 빚 때문에 노예가 되는 일을 금지하고, 재산에 따라 시민의 정치 참여 범위를 나누었다.' },
      { date: '기원전 508년', title: '클레이스테네스의 개혁', description: '혈연 중심의 부족을 지역 단위로 다시 짜고 시민의 참여를 넓혀 아테네 민주정의 토대를 놓았다.' },
    ],
  },
  {
    name: '고전기',
    period: '기원전 500년경 ~ 기원전 323년',
    description: '페르시아 전쟁을 거치며 아테네가 번영하고 철학과 연극, 건축이 꽃핀 시기. 그러나 아테네와 스파르타의 대립이 전쟁으로 번져 폴리스 세계는 크게 약해졌다.',
    events: [
      { date: '기원전 490년', title: '마라톤 전투', description: '아테네가 중심이 된 그리스군이 마라톤 평야에서 페르시아 원정군을 물리쳤다.' },
      { date: '기원전 480년', title: '살라미스 해전', description: '테미스토클레스가 이끈 그리스 연합 함대가 좁은 해협에서 페르시아 함대를 무찌르며 전쟁의 흐름을 바꾸었다.' },
      { date: '기원전 447년', title: '파르테논 신전 착공', description: '페리클레스 시대의 아테네가 아크로폴리스에 아테나 여신을 모시는 신전을 짓기 시작해 기원전 430년대에 마무리했다.' },
      { date: '기원전 431년 ~ 404년', title: '펠로폰네소스 전쟁', description: '아테네의 델로스 동맹과 스파르타의 펠로폰네소스 동맹이 맞붙은 오랜 전쟁. 아테네의 항복으로 끝났다.' },
      { date: '기원전 399년', title: '소크라테스의 죽음', description: '소크라테스가 젊은이를 타락시키고 신을 믿지 않는다는 죄로 재판을 받고 독배를 마셨다.' },
    ],
  },
  {
    name: '헬레니즘 시대',
    period: '기원전 323년 ~ 기원전 30년',
    description: '알렉산드로스 대왕의 원정으로 그리스 문화가 이집트와 서아시아까지 퍼지고, 그가 죽은 뒤 갈라진 여러 왕국에서 학문과 교역이 번성한 시기.',
    events: [
      { date: '기원전 336년 ~ 323년', title: '알렉산드로스 대왕의 원정', description: '마케도니아의 알렉산드로스가 페르시아 제국을 무너뜨리고 인도 서북부까지 나아갔다가 바빌론에서 세상을 떠났다.' },
      { date: '기원전 3세기', title: '알렉산드리아의 번영', description: '이집트의 알렉산드리아에 대도서관과 무세이온이 세워져 각지의 학자들이 모여들었다.' },
      { date: '기원전 146년', title: '코린토스의 파괴', description: '로마군이 코린토스를 무너뜨리면서 그리스 본토는 로마의 지배 아래 놓이게 되었다.' },
      { date: '기원전 30년', title: '프톨레마이오스 왕조의 멸망', description: '로마가 이집트를 병합하면서 알렉산드로스 사후에 갈라진 헬레니즘 왕국이 모두 사라졌다.' },
    ],
  },
];

/**
 * Build a fresh sample timeline (5 eras, each with events).
 * @param {() => string} [genId] id generator, defaults to the model's default
 * @returns {import('./model.js').Timeline}
 */
export function exampleTimeline(genId) {
  let tl = { ...createTimeline(), title: TITLE, subtitle: SUBTITLE };
  for (const era of ERAS) {
    tl = addEra(tl, era, genId);
    const eraId = tl.eras[tl.eras.length - 1].id;
    for (const event of era.events) tl = addEvent(tl, eraId, event, genId);
  }
  return tl;
}
