/* Vice City Countdown · Launch Week core utilities v2.5
 * Pure utilities used by the browser and Node smoke tests.
 * No network access, media access, tracking or third-party code.
 */
(function(root,factory){
  'use strict';
  const core=factory();
  if(typeof module==='object'&&module.exports)module.exports=core;
  else root.ViceLaunchWeekCore=core;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const MINUTE=60000,HOUR=60*MINUTE,DAY=24*HOUR;
  function phase(remainingMs){
    const n=Number(remainingMs);
    if(!Number.isFinite(n))return 'normal';
    if(n<=0)return 'launched';
    if(n<=MINUTE)return 'final-minute';
    if(n<=10*MINUTE)return 'final-ten';
    if(n<=HOUR)return 'final-hour';
    if(n<=6*HOUR)return 'final-six';
    if(n<=DAY)return 'last-day';
    return 'normal';
  }
  const PHASE_LABELS=Object.freeze({
    normal:['THE FINAL COUNTDOWN','The city awaits'],
    'last-day':['FINAL 24 HOURS','Less than one day until your region reaches midnight'],
    'final-six':['FINAL SIX HOURS','The night is almost here'],
    'final-hour':['FINAL HOUR','The last 60 minutes of the countdown'],
    'final-ten':['FINAL TEN MINUTES','Stay close to the clock'],
    'final-minute':['FINAL 60 SECONDS','Midnight is almost here'],
    launched:['WELCOME TO LEONIDA','The scheduled launch time has arrived']
  });
  function padded(n){return String(Math.trunc(n)).padStart(2,'0');}
  function remainingParts(ms){
    const seconds=Math.max(0,Math.ceil(Number(ms)/1000)||0);
    return {
      days:Math.floor(seconds/86400),
      hours:Math.floor(seconds%86400/3600),
      minutes:Math.floor(seconds%3600/60),
      seconds:seconds%60
    };
  }
  function shareText(ms,zone,platform){
    const time=remainingParts(ms);
    const countdown=time.days>0
      ?time.days+'d '+padded(time.hours)+'h '+padded(time.minutes)+'m'
      :padded(time.hours)+'h '+padded(time.minutes)+'m '+padded(time.seconds)+'s';
    const label=ms<=0?'The scheduled GTA VI release time has arrived':countdown+' until GTA VI';
    const extras=platform==='PS5'||platform==='Xbox Series X|S'?' · '+platform:'';
    return label+' · '+String(zone||'Selected region').slice(0,80)+extras+
      '\nUnofficial, spoiler-safe countdown: https://iillifoggyiilli.github.io/GTA-VI-Countdown/';
  }
  function calendarUTC(epochMs){
    if(!Number.isFinite(epochMs))throw new TypeError('Expected a numeric epoch');
    const d=new Date(epochMs);
    if(!Number.isFinite(d.getTime()))throw new TypeError('Invalid epoch');
    return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  }
  function icsEscape(value){
    return String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n')
      .replace(/,/g,'\\,').replace(/;/g,'\\;');
  }
  function buildCalendar(releaseMs,zone){
    if(!Number.isFinite(Number(releaseMs)))throw new TypeError('Release time missing');
    const begin=Number(releaseMs);
    const date=calendarUTC(begin),end=calendarUTC(begin+60*MINUTE);
    const zoneName=String(zone||'Selected region').replace(/[\r\n]/g,' ').slice(0,90);
    const uid='gtavi-'+date.toLowerCase()+'@vice-city-countdown';
    const lines=[
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vice City Countdown//Launch Event//EN',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
      'UID:'+uid,'DTSTAMP:'+calendarUTC(begin),
      'DTSTART:'+date,'DTEND:'+end,
      'SUMMARY:GTA VI scheduled regional launch',
      'DESCRIPTION:'+icsEscape('Reminder: GTA VI scheduled midnight release for '+zoneName+'. Confirm actual availability with your console account region. Unofficial fan-made reminder.'),
      'URL:https://iillifoggyiilli.github.io/GTA-VI-Countdown/',
      'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',
      'DESCRIPTION:GTA VI scheduled release is 30 minutes away',
      'END:VALARM','END:VEVENT','END:VCALENDAR'
    ];
    return lines.join('\r\n')+'\r\n';
  }
  return Object.freeze({phase,PHASE_LABELS,padded,remainingParts,shareText,calendarUTC,buildCalendar});
});
