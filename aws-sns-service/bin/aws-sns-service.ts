#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsSnsServiceStack } from '../lib/aws-sns-service-stack';

const app = new cdk.App();
new AwsSnsServiceStack(app, 'AwsSnsServiceStack');
