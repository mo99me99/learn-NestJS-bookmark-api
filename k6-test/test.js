import http from 'k6/http';
import { sleep } from 'k6';

// init
export const options = {
  vus: 10,
  duration: '30s',
  ext: {
      loadimpact: {
          projectID: 1234567,
          name: "MyTest"
      },
      influxdb: {
          enabled: true,
          address: 'http://localhost:8086',
          database: 'k6',
          tags: { project: 'myproject' },
          username: 'admin',
          password: 'admin123',
      }
  }
};


// vu script
export default function () {
  http.get('https://k6.io');
  sleep(1)
}
