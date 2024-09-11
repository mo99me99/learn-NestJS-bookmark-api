import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3333';

// See https://k6.io/docs/using-k6/k6-options/
export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'], // 95% of requests must complete below 800ms, and 99% must complete below 1.5s.
  },
  ext: {
    loadimpact: {
      name: 'Response Time Test',
    },
  },
};

export default function () {
  const signupPayload = {
    email: `${Math.random()}@test.com`,
    password: `${Math.random()}`,
  };

  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify(signupPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  console.log(
    `loginRes - Status Code: ${signupRes.status} - Response Body: ${signupRes.body}`,
  );
  sleep(1);
}
