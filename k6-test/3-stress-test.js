import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3333';

// See https://k6.io/docs/using-k6/k6-options/
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 VUs in 30 seconds
    { duration: '1m', target: 100 }, // Ramp up to 100 VUs in 1 minute
    { duration: '1m', target: 150 }, // Ramp up to 150 VUs in 1 minute
    { duration: '1m', target: 200 }, // Stay at 200 VUs for 5 minutes
    { duration: '1m', target: 30 }, // Ramp down to 30 VUs in 1 minute
  ],
  ext: {
    loadimpact: {
      name: 'Stress Test',
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

  if (signupRes.status === 201) {
    const { access_token } = JSON.parse(signupRes.body);
    console.log(access_token);
    const me = http.get(`${BASE_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      },
    });
    console.log(`me- Status Code: ${me.status} - Response Body: ${me.body}`);
  }
}
