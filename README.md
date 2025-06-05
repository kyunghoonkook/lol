# 롤 팀 밸런서 - 클라이언트

리그오브레전드 팀 밸런싱을 위한 React 프론트엔드 애플리케이션입니다.

## 설치 및 실행

### 개발 환경 설정

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정
클라이언트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
REACT_APP_SERVER_URL=http://localhost:5001
```

3. 개발 서버 실행
```bash
npm start
```

### 프로덕션 빌드

```bash
npm run build
```

## Vercel 배포

1. Vercel에 배포할 때는 환경 변수를 다음과 같이 설정하세요:
   - `REACT_APP_SERVER_URL`: 실제 백엔드 서버 URL

2. 이 프로젝트는 자동으로 빌드되어 배포됩니다.

## 주요 기능

- 플레이어 등록 및 관리
- 실시간 팀 밸런싱
- 티어별 점수 계산
- 오프라인 모드 지원

## 기술 스택

- React 19
- TypeScript
- Socket.io Client
- CSS3 (Flexbox, Grid)

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
