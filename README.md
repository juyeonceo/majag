# 🏃‍♂️ 3D Platformer Adventure (3D 플랫포머 장애물 달리기)

> **언리얼 엔진 5(UE5) 스타일의 핵심 게임플레이 기믹을 Three.js와 순수 웹 기술로 완벽 구현한 3D 플랫포머 게임**  
> 더블 점프, 슈퍼 점프대, 왕복 발판, 회전 통나무 장애물, 코인 수집, 낙사 리스폰, 스테이지 클리어 UI 및 무지연 Web Audio 효과음 완비.

![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=flat-square&logo=three.js)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-00F3FF?style=flat-square)

---

## 🎮 구현된 핵심 게임 메커니즘 (Features)

### 1. 🦘 3D 캐릭터 무브먼트 & 2단 점프 (Double Jump)
- **Air Control (공중 제어)**: 점프 중에도 WASD로 즉각적인 방향 전환 및 착지점 미세 조정 가능
- **Jump Max Count = 2 (더블 점프)**: 1차 점프 중 공중에서 한 번 더 도약 가능
- **동적 파티클 & 점프 인디케이터**: 점프 횟수에 따라 HUD의 `JUMP 1 / JUMP 2` 배지 실시간 점등 및 착지 시 초기화
- **실시간 그림자 블롭(Shadow Blob)**: 플레이어 밑바닥에 실시간 투영되는 그림자로 공중 위치 파악 용이

### 2. 🚀 슈퍼 점프대 (BP_JumpPad / Launch Character)
- 점프대 위를 밟으면 순간적으로 강력한 수직 가속도(`Velocity Y = 28.0`)를 부여하여 높은 절벽으로 도약
- 발판 압축 후 튕겨 올라오는 물리 스쿼시 애니메이션 + 로우 부스트 효과음

### 3. ↔️ 움직이는 발판 (BP_MovingPlatform / Ping-Pong)
- 좌우 및 상하로 부드러운 코사인 감속을 그리며 무한 왕복하는 발판
- 플레이어가 발판 위에 올라타면 발판의 속도 벡터(`Delta`)를 캐릭터에 동기화하여 함께 이동

### 4. 🪓 회전 장애물 (BP_RotatingObstacle / Rotating Movement)
- 중심축을 기준으로 360도 연속 회전하는 붉은색 회전 빔
- 캐릭터 피격 시 넉백 충격파 발생 및 밀려남 판정

### 5. 🪙 황금 코인 수집 시스템 (BP_Coin)
- 3D 맵 곳곳에 공중 부양하며 360도 회전하는 12개의 황금 코인
- 캐릭터 닿을 시 반짝이는 황금 스파크 파티클 폭발 + 2단계 아르페지오 차임벨 효과음 + HUD 점수 실시간 누적

### 6. 💀 낙사 구역 & 리스폰 (BP_KillZone / Teleport)
- 발판 아래 허공으로 추락 시(`Y < -12`) 화면이 부드럽게 암전(Fade to Black)
- 플레이어 속도를 0으로 초기화하고 안전하게 시작 지점으로 즉시 텔레포트

### 7. 🏆 스테이지 클리어 & 재시작 루프 (BP_Goal & WBP_ClearScreen)
- 최종 목적지 골인 포탈 진입 시 축하 불꽃놀이 파티클 + 승리 팡파레 효과음 재생
- 최종 클리어 타임 및 획득 코인 수를 집계하는 글래스모피즘 결과 창 표출
- `RETRY (다시 도전하기)` 버튼으로 언제든 처음부터 즉시 재도전 가능

### 8. 🔊 Web Audio API 무지연 오실레이터 사운드
- 외부 `.mp3`나 `.wav` 음원 다운로드 없이, 브라우저 내장 오실레이터로 100% 실시간 합성되는 6종 효과음 탑재:
  - 일반 점프음, 더블 점프음, 슈퍼 점프대 부스트음, 코인 획득 차임벨, 낙사 하강음, 클리어 팡파레

---

## 🕹️ 조작 방법 (Controls)

| 조작 키 | 동작 |
| :--- | :--- |
| **`W, A, S, D`** 또는 **방향키** | 3D 캐릭터 8방향 이동 |
| **`Spacebar`** | 1단 점프 |
| **`Spacebar` (공중에서 연타)** | **2단 점프 (Double Jump)** |
| **마우스 좌클릭 드래그** | 3인칭 팔로우 카메라 시점 360도 회전 |
| **`R`** | 게임 즉시 재시작 |

---

## 🚀 실행 방법 (How to Play)

별도의 복잡한 빌드나 설치 과정 없이 바로 플레이할 수 있습니다.

1. 저장소를 클론합니다:
   ```bash
   git clone https://github.com/juyeonceo/majag.git
   ```
2. `index.html` 파일을 더블 클릭하여 Chrome, Edge 등의 웹 브라우저에서 바로 실행합니다.
