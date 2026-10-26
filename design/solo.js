/* render the mixer alone into #djm at the canvas pixel size */
function renderDJM(cv,W){const s=W/DM_W;cv.width=W;cv.height=Math.round((DM_Y1-DM_Y0)*s);cv.style.width=(W/(window.DJM_DPR||1))+'px';
  const P=new Painter([0,DM_Y0,DM_W,DM_Y1],s);drawMixerBody(P,DJM_STATE);cv.getContext('2d').drawImage(P.cv,0,0);}
