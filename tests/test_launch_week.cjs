'use strict';
// v2.5 unit tests — run offline with: node tests/test_launch_week.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../assets/launch-week-core.js');

const minute=60000, hour=60*minute,day=24*hour;
assert.equal(core.phase(3*day),'normal');
assert.equal(core.phase(day+1),'normal');
assert.equal(core.phase(day),'last-day');
assert.equal(core.phase(6*hour+1),'last-day');
assert.equal(core.phase(6*hour),'final-six');
assert.equal(core.phase(hour+1),'final-six');
assert.equal(core.phase(hour),'final-hour');
assert.equal(core.phase(10*minute+1),'final-hour');
assert.equal(core.phase(10*minute),'final-ten');
assert.equal(core.phase(minute+1),'final-ten');
assert.equal(core.phase(minute),'final-minute');
assert.equal(core.phase(1),'final-minute');
assert.equal(core.phase(0),'launched');
assert.equal(core.phase(-1),'launched');
assert.equal(core.phase(NaN),'normal');
assert.equal(core.PHASE_LABELS['final-minute'][0],'FINAL 60 SECONDS');

const parts=core.remainingParts(day+hour+minute+999);
assert.deepEqual(parts,{days:1,hours:1,minutes:1,seconds:1});
assert.deepEqual(core.remainingParts(0),{days:0,hours:0,minutes:0,seconds:0});
assert.ok(core.shareText(2*hour,'Australia/Sydney','PS5').includes('02h 00m 00s'));
assert.ok(core.shareText(0,'Australia/Sydney','none').includes('scheduled GTA VI release time'));

const SydneyRelease=Date.parse('2026-11-18T13:00:00.000Z');
const ics=core.buildCalendar(SydneyRelease,'Australia/Sydney');
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
assert.ok(ics.includes('DTSTART:20261118T130000Z'));
assert.ok(ics.includes('DTEND:20261118T140000Z'));
assert.ok(ics.includes('SUMMARY:GTA VI scheduled regional launch'));
assert.ok(ics.includes('DESCRIPTION:Reminder: GTA VI scheduled midnight release for Australia/Sydney'));
assert.ok(ics.includes('END:VCALENDAR'));
assert.equal(ics.replaceAll('\r\n','').includes('\n'),false,'Use CRLF calendar format');
assert.ok(ics.includes('TRIGGER:-PT30M'),'Calendar event must include a 30-minute reminder');
assert.equal(core.calendarUTC(SydneyRelease),'20261118T130000Z');
assert.throws(()=>core.buildCalendar(NaN,'Australia/Sydney'),/Release time missing/);
assert.ok(core.buildCalendar(SydneyRelease,'New\nLocation').includes('New Location'));

const site=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const worker=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const code=fs.readFileSync(path.join(__dirname,'../assets/launch-week.js'),'utf8');
for(const id of [
 'launch-eve-banner','launch-eve-title','launch-eve-detail',
 'launch-kit','kit-check-items','kit-check-count','kit-check-progress','kit-clear-checklist',
 'kit-preview-count','kit-download-card','kit-copy-share','kit-calendar',
 'kit-platform','kit-motion','kit-sounds','kit-strict','kit-reset-settings',
 'kit-settings-status','kit-share-status'
]){
 assert.ok(site.includes('id="'+id+'"'),'Missing v2.5 element: '+id);
}
for(const pathName of [
 'assets/launch-week.js?v=2.5.0','assets/launch-week-core.js?v=2.5.0',
 'assets/launch-week.css?v=2.5.0',
 'assets/cinematic-launch.css?v=2.6.0','assets/cinematic-launch.js?v=2.6.1'
]){
 assert.ok(site.includes(pathName),'Missing app-shell asset: '+pathName);
 assert.ok(worker.includes(pathName),'Missing offline cache asset: '+pathName);
}
assert.ok(worker.includes('vice-city-countdown-v11'));
assert.ok(code.includes("media-toggle"),'Strict spoiler mode must control optional media access');
assert.ok(code.includes("toBlob"),'Countdown card must export as a real image');
assert.ok(code.includes("new Blob([file]"),'Calendar must download as an .ics file');
assert.ok(!code.includes("fetch("),'Launch kit must not fetch external services');
assert.ok(!code.includes("window.open("),'Launch kit must not auto-open links');
console.log('PASS: launch stage boundaries, regional calendar, share text, offline features and strict spoiler gate');
