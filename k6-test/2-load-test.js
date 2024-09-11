import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = 'http://localhost:3333';

// See https://k6.io/docs/using-k6/k6-options/
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // traffic ramp-up from 1 to 50 users over 2 minutes.
    { duration: '60s', target: 20 }, // stay at 50 users for 5 minutes
    { duration: '30s', target: 0 }, // ramp-down to 0 users
  ],
  ext: {
    loadimpact: {
      name: 'Load Test',
    },
  },
}

export default function () {
  const data = { email: `fake${Math.random()}@test.com`, password: `pas${Math.random()}` }
  let loginRes = http.post(`${BASE_URL}/auth/signup`, JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })

  check(loginRes, { 'success signup': (r) => r.status === 201 })
  console.log(`Status Code: ${loginRes.status} - Response Body: ${loginRes.body}`)
  sleep(1)
}