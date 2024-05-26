import { Scenes, Context } from 'telegraf';
import { Game } from './models/Game';

interface MySceneSession extends Scenes.SceneSessionData {
  // will be available under `ctx.scene.session.mySceneSessionProp`
  mySceneSessionProp: number;
}

export interface MySession extends Scenes.SceneSession<MySceneSession> {
  // will be available under `ctx.session.mySessionProp`
  mySessionProp: number;
}

export interface MyContext extends Context {
  session: MySession;

  currentGame: Game | null;

  // declare scene type
  scene: Scenes.SceneContextScene<MyContext, MySceneSession>;
}
