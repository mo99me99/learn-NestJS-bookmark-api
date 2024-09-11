import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3333';

// See https://k6.io/docs/using-k6/k6-options/
export const options = {
  stages: [
    { duration: '2m', target: 2000 }, // fast ramp-up to a high point
    { duration: '1m', target: 0 }, // ramp-down to 0 users
  ],
  ext: {
    loadimpact: {
      name: 'Spike Test',
    },
  },
};

export default function () {
  const signupPayload = {
    email: `${Math.random()}@test.com`,
    password: `${Math.random()}`,
  };
  let signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify(signupPayload),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  check(signupRes, { 'success signup': (r) => r.status === 201 });
  console.log(
    `loginRes - Status Code: ${signupRes.status} -Response Time : ${signupRes.timings}- Response Body: ${signupRes.body}`,
  );
}
