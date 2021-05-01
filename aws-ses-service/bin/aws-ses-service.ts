#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsSesServiceStack } from '../lib/aws-ses-service-stack';

const app = new cdk.App();
new AwsSesServiceStack(app, 'AwsSesServiceStack');
