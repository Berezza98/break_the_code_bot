import { Scenes, Context } from 'telegraf';

interface MySceneSession extends Scenes.SceneSessionData {
  // will be available under `ctx.scene.session.mySceneSessionProp`
  mySceneSessionProp: number;
}

export interface MySession extends Scenes.SceneSession<MySceneSession> {
  // will be available under `ctx.session.mySessionProp`
  mySessionProp: number;
  selectedChannelId?: string;
  selectedPhraseId?: string;
}

export interface MyContext extends Context {
  session: MySession;

  // declare scene type
  scene: Scenes.SceneContextScene<MyContext, MySceneSession>;
}
