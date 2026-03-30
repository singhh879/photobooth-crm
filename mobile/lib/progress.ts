export function calcProgress(event: Record<string, any>): number {
  let score = 0;
  if (event.city) score++;
  if (event.event_date) score++;
  if (event.client_name) score++;
  if (event.venue) score++;
  if (event.timing_from && event.timing_to) score++;
  if (event.photobooth_type) score++;
  if (event.package) score++;
  if (event.event_team && event.event_team.length > 0) score++;
  if (event.template_status === 'done') score++;
  return score;
}
