require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('=== SYSTEM CHECK: LEADS DATABASE ===\n');

  // 1. Total count
  const { count } = await s.from('leads').select('*', { count: 'exact', head: true });
  console.log('Total leads in DB:', count);

  // 2. By source
  const { data: allLeads } = await s.from('leads').select('source, status, lead_type');
  const srcMap = {}, statMap = {}, typeMap = {};
  allLeads.forEach(l => {
    srcMap[l.source] = (srcMap[l.source] || 0) + 1;
    statMap[l.status] = (statMap[l.status] || 0) + 1;
    typeMap[l.lead_type || 'null'] = (typeMap[l.lead_type || 'null'] || 0) + 1;
  });
  console.log('By source:', srcMap);
  console.log('By status:', statMap);
  console.log('By lead_type:', typeMap);

  // 3. Pagination test
  console.log('\n=== API TEST: Pagination ===');
  const { data: page1, error: e1 } = await s.from('leads').select('id,name')
    .order('created_at', { ascending: false }).range(0, 19);
  console.log('Page 1 (20 items):', page1?.length, 'items', e1?.message || 'OK');

  const { data: page2 } = await s.from('leads').select('id,name')
    .order('created_at', { ascending: false }).range(20, 39);
  console.log('Page 2 (20 items):', page2?.length, 'items');

  const { data: page100 } = await s.from('leads').select('id,name')
    .order('created_at', { ascending: false }).range(3000, 3019);
  console.log('Page at offset 3000:', page100?.length, 'items');

  // 4. Search test
  console.log('\n=== API TEST: Search ===');
  const { data: s1 } = await s.from('leads').select('id,name').ilike('name', '%dubai%');
  console.log('Search "dubai":', s1?.length, 'results');

  const { data: s2 } = await s.from('leads').select('id,name').ilike('name', '%lama%');
  console.log('Search "lama":', s2?.length, 'results');

  const { data: s3 } = await s.from('leads').select('id,name').ilike('name', '%smith%');
  console.log('Search "smith":', s3?.length, 'results');

  // 5. Single lead detail test
  console.log('\n=== API TEST: Single Lead Detail ===');
  const { data: single, error: e3 } = await s.from('leads')
    .select('*, assigned_user:assigned_to(id, full_name, email)')
    .limit(1).single();
  console.log('Single lead fetch:', single?.name, e3?.message || 'OK');
  console.log('Fields present:', Object.keys(single || {}).join(', '));

  // 6. Lead with relations
  console.log('\n=== API TEST: Lead Relations ===');
  const { data: withBookings, error: e4 } = await s.from('leads')
    .select('id, name, lead_bookings(id)').limit(5);
  console.log('Leads with bookings join:', withBookings?.length, 'fetched', e4?.message || 'OK');

  // 7. Update test (read-only check)
  console.log('\n=== API TEST: Update ===');
  const testLead = allLeads.length > 0 ? page1[0] : null;
  if (testLead) {
    const { error: e5 } = await s.from('leads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testLead.id);
    console.log('Update test:', e5?.message || 'OK');
  }

  // 8. Performance check - large query
  console.log('\n=== PERFORMANCE: Large Query ===');
  const start = Date.now();
  const { data: allNames, error: e6 } = await s.from('leads')
    .select('id, name, email, phone, status, source')
    .order('created_at', { ascending: false })
    .limit(1000);
  const elapsed = Date.now() - start;
  console.log(`Fetch 1000 leads: ${elapsed}ms, got ${allNames?.length} items`, e6?.message || 'OK');

  // 9. Check for data quality issues
  console.log('\n=== DATA QUALITY ===');
  const noName = allLeads.filter(l => !l.source).length;
  console.log('Leads without source:', noName);

  const { data: nullNames } = await s.from('leads').select('id').is('name', null);
  console.log('Leads with null name:', nullNames?.length || 0);

  const { data: emptyNames } = await s.from('leads').select('id,name').eq('name', '');
  console.log('Leads with empty name:', emptyNames?.length || 0);

  // 10. Verify RLS doesn't block service role
  console.log('\n=== RLS CHECK ===');
  const { error: rlsErr } = await s.from('leads').select('id').limit(1);
  console.log('Service role read:', rlsErr?.message || 'OK');

  console.log('\n=== SYSTEM CHECK COMPLETE ===');
}

check().catch(e => console.error('Fatal:', e));
