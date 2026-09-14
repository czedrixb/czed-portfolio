import { expect, test } from '@playwright/test';

test('active layers trap focus and zoom panning stays bounded',async({page})=>{
 await page.goto('/');await open(page,'Sentrix').click();
 const tray=page.locator('.project-tray');
 await page.keyboard.press('Shift+Tab');
 expect(await tray.evaluate(el=>el.contains(document.activeElement))).toBe(true);
 await tray.getByRole('button',{name:'Expand project image'}).click();
 const viewer=page.locator('.image-viewer');
 await page.keyboard.press('Shift+Tab');
 await expect(viewer.getByRole('button',{name:'Close image viewer'})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(viewer.getByRole('button',{name:'Zoom out'})).toBeFocused();
 for(let i=0;i<15;i++) await viewer.getByRole('button',{name:'Zoom in',exact:true}).click();
 await expect(viewer.getByText('400%',{exact:true})).toBeVisible();
 const canvas=viewer.locator('.viewer-canvas'); const box=await canvas.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 await page.mouse.move(box.x+box.width*2,box.y+box.height*2,{steps:5});await page.mouse.up();
 const valid=await canvas.evaluate(el=>{
  const img=el.querySelector('img'), m=new DOMMatrix(getComputedStyle(img).transform);
  const fit=Math.min(el.clientWidth/img.naturalWidth,el.clientHeight/img.naturalHeight);
  return Math.abs(m.e)<=Math.max(0,(img.naturalWidth*fit*4-el.clientWidth)/2)+1 && Math.abs(m.f)<=Math.max(0,(img.naturalHeight*fit*4-el.clientHeight)/2)+1;
 });
 expect(valid).toBe(true);
});
test.describe('server-rendered fallback',()=>{
 test.use({javaScriptEnabled:false});
 test('homepage content and previews stay visible without JavaScript',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Czedrix Barcena'})).toBeVisible();
  await expect(page.locator('.project-0 img')).toHaveCSS('opacity','1');
  await expect(page.getByRole('link',{name:'View my CV ↗',exact:true})).toHaveAttribute('href','/pdf/RESUME-2025-CZEDRIX-BARCENA.pdf');
 });
});
const open = (page,name) => page.getByRole('button',{name:'Open '+name+' project details'});
test.use({ viewport:{width:1440,height:1000} });
test('reference composition, real destinations, and centered tray with stacked zoom',async ({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(open(page,'Sentrix')).toBeEnabled();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Czedrix Barcena'})).toBeVisible();
  await expect(page.locator('.bento-panel')).toHaveCount(9);
  await expect(page.getByRole('link',{name:'✉ Email ↗',exact:true})).toHaveAttribute('href','mailto:czedrixb@gmail.com');
  const boxes=await page.locator('.bento-panel').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
  expect(Math.abs(boxes[0].y-boxes[1].y)).toBeLessThan(2);
  expect(Math.abs(boxes[1].y-boxes[2].y)).toBeLessThan(2);
  expect(boxes[1].w).toBeGreaterThan(boxes[2].w);
  expect(Math.abs(boxes[3].y-boxes[4].y)).toBeLessThan(2);
  expect(Math.abs(boxes[4].y-boxes[5].y)).toBeLessThan(2);
  expect(boxes[6].y).toBeGreaterThan(boxes[4].y);
  expect(boxes[7].y).toBeCloseTo(boxes[6].y,0);
  expect(Math.abs(boxes[7].x-boxes[8].x)).toBeLessThan(2);
  expect(boxes[8].y).toBeGreaterThan(boxes[7].y);
  await expect(page.locator('.project-preview img.decoded')).toHaveCount(5);
  await page.screenshot({path:'docs/verification/homepage-after.png',fullPage:true});
  await open(page,'Sentrix').click();
  const tray=page.getByRole('dialog',{name:'Sentrix',exact:true});
  await expect(tray).toBeVisible();
  await tray.evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
  const b=await tray.boundingBox();
  const viewport=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
  expect(Math.abs(b.x+b.width/2-viewport.w/2)).toBeLessThan(2);
  expect(Math.abs(b.y+b.height/2-viewport.h/2)).toBeLessThan(2);
  await expect(page.locator('.site-frame')).toHaveAttribute('inert','');
  await expect(tray.locator('.gallery-stage img')).toHaveClass(/decoded/);
  await expect(tray.locator('.gallery-stage img')).toHaveCSS('opacity','1');
  await page.screenshot({path:'docs/verification/tray-after.png'});
  await tray.getByRole('button',{name:'Show screenshot 2',exact:true}).click();
  await expect(tray.getByRole('button',{name:'Show screenshot 2',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(tray.locator('.gallery-stage img')).toHaveClass(/decoded/);
  await tray.getByRole('button',{name:'Expand project image'}).click();
  const viewer=page.getByRole('dialog',{name:'Expanded project image'});
  await expect(viewer).toBeVisible();
  await viewer.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(viewer.getByText('125%',{exact:true})).toBeVisible();
  await viewer.getByRole('button',{name:'Reset image fit'}).click();
  await expect(viewer.getByText('100%',{exact:true})).toBeVisible();
  await page.screenshot({path:'docs/verification/viewer-after.png'});
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(tray.getByRole('button',{name:'Expand project image'})).toBeFocused();
  await expect(tray.getByRole('button',{name:'Show screenshot 2',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');
  await expect(tray).toBeHidden();
  await expect(open(page,'Sentrix')).toBeFocused();
  await expect(page.locator('.site-frame')).not.toHaveAttribute('inert');
  expect(errors).toEqual([]);
});
test('all five projects and project navigation use the displayed order',async({page})=>{
 await page.goto('/');
 for(const name of ['Sentrix','Forkcast','Arawan','Tindahan','My Notes']){
  await open(page,name).click();
  await expect(page.getByRole('dialog',{name,exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.project-tray')).toBeHidden();
 }
 await open(page,'Sentrix').click();
 await page.getByRole('button',{name:'Next project',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Forkcast',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Show screenshot 1',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Next project',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Arawan',exact:true})).toBeVisible();
});
test('mobile and tablet stack without horizontal overflow',async({page})=>{
 for(const width of [390,768]){
  await page.setViewportSize({width,height:844}); await page.goto('/');
  await expect(open(page,'Sentrix')).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await open(page,'Sentrix').click();
  await expect(page.getByRole('button',{name:'Close project details'})).toBeInViewport();
  await page.keyboard.press('Escape'); await expect(page.locator('.project-tray')).toBeHidden();
 }
});
test('failed preview reserves its frame and offers retry',async({page})=>{
 let failed=true;
 await page.route('**/images/sentrix/shop.jpg*',route=>failed?route.abort():route.continue());
 await page.goto('/');
 const frame=page.locator('.project-0 .preview-frame');
 await expect(frame.getByText('Preview unavailable')).toBeVisible();
 const before=await frame.boundingBox();
 failed=false;await frame.getByRole('button',{name:'Retry preview'}).click();
 await expect(frame.locator('img')).toHaveClass(/decoded/);
 const after=await frame.boundingBox();expect(Math.abs(before.height-after.height)).toBeLessThan(1);
});
test.describe('reduced motion',()=>{
 test.use({reducedMotion:'reduce'});
 test('panels remain visible and have no entrance animation',async({page})=>{
  await page.goto('/');await expect(open(page,'Sentrix')).toBeEnabled();
  await expect(page.locator('.reveal-panel').first()).toHaveCSS('opacity','1');
  await expect(page.locator('.reveal-panel').first()).toHaveCSS('animation-name','none');
 });
});
